import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  POST /api/whatif/create — create a user-authored What-If scenario.
  Requires authentication. Rate limited to 5 scenarios per user per day.
*/

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_CATEGORIES = ["politics", "economy", "tech", "society", "sports", "entertainment", "general"];

interface OutcomeInput {
  label: string;
  description?: string;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    category?: string;
    body?: string;
    outcomes?: OutcomeInput[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate fields
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const category = (body.category || "general").toLowerCase();
  const articleBody = (body.body || "").trim();
  const outcomes = body.outcomes || [];

  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Title is required (max 120 chars)" }, { status: 400 });
  }
  if (!description || description.length > 300) {
    return NextResponse.json({ error: "Description is required (max 300 chars)" }, { status: 400 });
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (articleBody.length > 5000) {
    return NextResponse.json({ error: "Body too long (max 5000 chars)" }, { status: 400 });
  }
  if (outcomes.length < 2 || outcomes.length > 4) {
    return NextResponse.json({ error: "Provide 2-4 outcomes" }, { status: 400 });
  }
  for (const o of outcomes) {
    if (!o.label || o.label.trim().length === 0 || o.label.length > 100) {
      return NextResponse.json({ error: "Each outcome needs a label (max 100 chars)" }, { status: 400 });
    }
  }

  // Rate limit: max 5 scenarios per user per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("scenarios")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", oneDayAgo);

  if ((recentCount || 0) >= 5) {
    return NextResponse.json({ error: "Daily limit reached (5 scenarios per day)" }, { status: 429 });
  }

  // Create scenario
  const { data: scenario, error: scenarioErr } = await supabase
    .from("scenarios")
    .insert({
      title,
      description,
      body: articleBody || null,
      category,
      author_id: user.id,
      is_ai_generated: false,
      content_type: "prediction",
      read_time: Math.max(1, Math.ceil((articleBody.length || 0) / 1000)),
      status: "active",
      country: "global",
    })
    .select("id")
    .single();

  if (scenarioErr || !scenario) {
    console.error("[create] scenario insert error:", scenarioErr);
    return NextResponse.json({ error: "Failed to create scenario" }, { status: 500 });
  }

  // Create outcomes
  const outcomeRows = outcomes.map((o) => ({
    scenario_id: scenario.id,
    label: o.label.trim(),
    description: (o.description || "").trim() || null,
    vote_count: 0,
  }));

  const { error: outcomesErr } = await supabase
    .from("outcomes")
    .insert(outcomeRows);

  if (outcomesErr) {
    console.error("[create] outcomes insert error:", outcomesErr);
    // Clean up the scenario
    await supabase.from("scenarios").delete().eq("id", scenario.id);
    return NextResponse.json({ error: "Failed to create outcomes" }, { status: 500 });
  }

  return NextResponse.json({ id: scenario.id }, { status: 201 });
}
