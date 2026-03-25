import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";

/*
  GET  /api/whatif/[id]/comments — list comments for a scenario
  POST /api/whatif/[id]/comments — add an anonymous comment
*/

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_LENGTH = 2000;
const MAX_NAME_LENGTH = 50;

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + (process.env.CRON_SECRET || "salt")).digest("hex").slice(0, 16);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("id, scenario_id, parent_id, display_name, body, created_at")
    .eq("scenario_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comments] GET error:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }

  return NextResponse.json(
    { comments: data || [] },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=5" } }
  );
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

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: { display_name?: string; body?: string; parent_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const commentBody = (body.body || "").trim();
  const displayName = (body.display_name || "Anonymous").trim().slice(0, MAX_NAME_LENGTH);
  const parentId = body.parent_id || null;

  if (!commentBody || commentBody.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "Comment must be 1-2000 characters" }, { status: 400 });
  }

  if (parentId && !UUID_RE.test(parentId)) {
    return NextResponse.json({ error: "Invalid parent_id" }, { status: 400 });
  }

  const ipHash = hashIp(clientIp);

  // Spam check: max 5 comments per IP per scenario
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("scenario_id", id)
    .eq("ip_hash", ipHash);

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: "Comment limit reached for this article" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      scenario_id: id,
      parent_id: parentId,
      display_name: displayName,
      body: commentBody,
      ip_hash: ipHash,
    })
    .select("id, scenario_id, parent_id, display_name, body, created_at")
    .single();

  if (error) {
    console.error("[comments] POST error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
