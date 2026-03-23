import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/*
  GET /api/whatif/[id]
  Single scenario with all related data: outcomes, timeline, impact averages, evidence.
*/

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServerSupabase();

    // Fetch scenario + outcomes + author
    const { data: scenario, error } = await supabase
      .from("scenarios")
      .select("*, outcomes(*), profile:profiles(*)")
      .eq("id", id)
      .single();

    if (error || !scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    // Fetch timeline nodes
    const { data: timeline } = await supabase
      .from("timeline_nodes")
      .select("*")
      .eq("scenario_id", id)
      .order("sort_order", { ascending: true });

    // Fetch average impact ratings
    const { data: impacts } = await supabase
      .from("impact_ratings")
      .select("economy, politics, society, tech")
      .eq("scenario_id", id);

    const impactAvg = { economy: 0, politics: 0, society: 0, tech: 0, count: 0 };
    if (impacts && impacts.length > 0) {
      impactAvg.count = impacts.length;
      for (const r of impacts) {
        impactAvg.economy += r.economy;
        impactAvg.politics += r.politics;
        impactAvg.society += r.society;
        impactAvg.tech += r.tech;
      }
      impactAvg.economy = Math.round(impactAvg.economy / impacts.length);
      impactAvg.politics = Math.round(impactAvg.politics / impacts.length);
      impactAvg.society = Math.round(impactAvg.society / impacts.length);
      impactAvg.tech = Math.round(impactAvg.tech / impacts.length);
    }

    // Fetch evidence links
    const { data: evidence } = await supabase
      .from("evidence_links")
      .select("*")
      .eq("scenario_id", id)
      .order("upvotes", { ascending: false });

    return NextResponse.json({
      ...scenario,
      timeline: timeline || [],
      impact: impactAvg,
      evidence: evidence || [],
    });
  } catch (err) {
    console.error("[whatif] Detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
