import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/*
  GET /api/whatif?category=all&sort=trending&page=1&limit=20
  List scenarios with outcomes and author profiles.
*/

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "trending";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const supabase = await createServerSupabase();

    let query = supabase
      .from("scenarios")
      .select("*, outcomes(*), profile:profiles(*)", { count: "exact" })
      .eq("status", "active")
      .range(offset, offset + limit - 1);

    if (category !== "all") {
      query = query.eq("category", category);
    }

    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "most_voted":
        query = query.order("vote_count", { ascending: false });
        break;
      case "trending":
      default:
        query = query.order("vote_count", { ascending: false }).order("created_at", { ascending: false });
        break;
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[whatif] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch scenarios" }, { status: 500 });
    }

    return NextResponse.json({
      scenarios: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (err) {
    console.error("[whatif] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
