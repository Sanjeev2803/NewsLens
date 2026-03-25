import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  GET /api/whatif/[id]
  Single scenario with all related data: outcomes, timeline, impact averages, evidence.
*/

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid scenario ID" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();

    // Fetch all data in parallel instead of sequentially
    const [scenarioResult, timelineResult, impactResult, evidenceResult] = await Promise.all([
      supabase
        .from("scenarios")
        .select("*, outcomes(*), profile:profiles(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("timeline_nodes")
        .select("*")
        .eq("scenario_id", id)
        .order("sort_order", { ascending: true }),
      supabase.rpc("avg_impact_ratings", { scenario_uuid: id }),
      supabase
        .from("evidence_links")
        .select("*")
        .eq("scenario_id", id)
        .order("upvotes", { ascending: false }),
    ]);

    if (scenarioResult.error || !scenarioResult.data) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    // Impact: use Postgres AVG() via RPC, fall back to zeros
    const impactRow = impactResult.data?.[0];
    const impact = impactRow
      ? {
          economy: Math.round(impactRow.avg_economy || 0),
          politics: Math.round(impactRow.avg_politics || 0),
          society: Math.round(impactRow.avg_society || 0),
          tech: Math.round(impactRow.avg_tech || 0),
          count: impactRow.rating_count || 0,
        }
      : { economy: 0, politics: 0, society: 0, tech: 0, count: 0 };

    return NextResponse.json(
      {
        ...scenarioResult.data,
        timeline: timelineResult.data || [],
        impact,
        evidence: evidenceResult.data || [],
      },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=10" } }
    );
  } catch (err) {
    console.error("[whatif] Detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
