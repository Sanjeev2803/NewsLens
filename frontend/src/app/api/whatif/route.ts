import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  GET /api/whatif?category=all&sort=trending&page=1&limit=20
  List scenarios with outcomes and author profiles.
*/

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "trending";
  const source = searchParams.get("source") || "all"; // "all" | "ai" | "community"
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  // Detect user's country from IP (Vercel header → query param → default)
  const ipCountry = (
    req.headers.get("x-vercel-ip-country") ||
    searchParams.get("country") ||
    "in"
  ).toLowerCase();

  try {
    const supabase = await createServerSupabase();

    // Strategy: fetch local scenarios first, backfill with others if not enough
    const buildQuery = (countryFilter?: string) => {
      let q = supabase
        .from("scenarios")
        .select("*, outcomes(*), profile:profiles(*)", { count: "exact" })
        .eq("status", "active");

      if (category !== "all") q = q.eq("category", category);
      if (countryFilter) q = q.eq("country", countryFilter);
      if (source === "ai") q = q.eq("is_ai_generated", true);
      if (source === "community") q = q.eq("is_ai_generated", false);

      switch (sort) {
        case "newest":
          q = q.order("created_at", { ascending: false });
          break;
        case "most_voted":
          q = q.order("vote_count", { ascending: false });
          break;
        default:
          q = q.order("vote_count", { ascending: false }).order("created_at", { ascending: false });
      }

      return q;
    };

    // Try local country first
    const { data: localData, count: localCount } = await buildQuery(ipCountry)
      .range(offset, offset + limit - 1);

    let scenarios = localData || [];
    let total = localCount || 0;

    // If not enough local results, backfill with all countries
    if (scenarios.length < limit) {
      const localIds = new Set(scenarios.map((s) => s.id));
      const backfillNeeded = limit - scenarios.length;
      const { data: globalData, count: globalCount } = await buildQuery()
        .range(0, backfillNeeded + scenarios.length - 1);

      const backfill = (globalData || []).filter((s) => !localIds.has(s.id));
      scenarios = [...scenarios, ...backfill.slice(0, backfillNeeded)];
      total = Math.max(total, globalCount || 0);
    }

    return NextResponse.json(
      {
        scenarios,
        total,
        page,
        limit,
        hasMore: total > offset + limit,
      },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=10" } }
    );
  } catch (err) {
    console.error("[whatif] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
