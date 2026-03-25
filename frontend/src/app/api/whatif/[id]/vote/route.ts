import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

/*
  POST /api/whatif/[id]/vote — anonymous voting on outcomes.
  Uses service-role Supabase to bypass RLS.
  Tracks by IP hash to prevent duplicate votes per scenario.
*/

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env.CRON_SECRET || "salt")).digest("hex").slice(0, 16);
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { id: scenarioId } = await params;
  if (!UUID_RE.test(scenarioId)) {
    return NextResponse.json({ error: "Invalid scenario ID" }, { status: 400 });
  }

  let body: { outcome_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const outcomeId = body.outcome_id;
  if (!outcomeId || !UUID_RE.test(outcomeId)) {
    return NextResponse.json({ error: "Invalid outcome_id" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const ipHash = hashIp(clientIp);

  // Verify the outcome belongs to this scenario
  const { data: outcome } = await supabase
    .from("outcomes")
    .select("id, vote_count")
    .eq("id", outcomeId)
    .eq("scenario_id", scenarioId)
    .single();

  if (!outcome) {
    return NextResponse.json({ error: "Outcome not found" }, { status: 404 });
  }

  // Check for duplicate vote (using anonymous_votes table if it exists)
  // If table doesn't exist, we skip dedup and rely on localStorage client-side
  try {
    const { data: existing } = await supabase
      .from("anonymous_votes")
      .select("outcome_id")
      .eq("scenario_id", scenarioId)
      .eq("ip_hash", ipHash)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Already voted", voted_outcome_id: existing.outcome_id },
        { status: 409 }
      );
    }

    // Record the vote
    await supabase
      .from("anonymous_votes")
      .insert({ scenario_id: scenarioId, outcome_id: outcomeId, ip_hash: ipHash });
  } catch {
    // Table might not exist yet — proceed without dedup
  }

  // Increment outcome vote_count
  await supabase
    .from("outcomes")
    .update({ vote_count: (outcome.vote_count || 0) + 1 })
    .eq("id", outcomeId);

  // Increment scenario vote_count
  const { data: scenario } = await supabase
    .from("scenarios")
    .select("vote_count")
    .eq("id", scenarioId)
    .single();

  if (scenario) {
    await supabase
      .from("scenarios")
      .update({ vote_count: (scenario.vote_count || 0) + 1 })
      .eq("id", scenarioId);
  }

  // Return updated outcomes
  const { data: updatedOutcomes } = await supabase
    .from("outcomes")
    .select("id, label, description, vote_count")
    .eq("scenario_id", scenarioId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    voted_outcome_id: outcomeId,
    outcomes: updatedOutcomes || [],
  });
}
