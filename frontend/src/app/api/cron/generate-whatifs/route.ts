import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleTrends } from "@/lib/regionalSources";
import { generateScenarios } from "@/lib/whatif/generator";
import { createClient } from "@supabase/supabase-js";
import { isSafeUrl } from "@/lib/ssrf";

/*
  Cron: Auto-generate What If scenarios from trending topics.
  Runs every 30 minutes. Deduplicates by trend title to avoid repeats.
  Uses service-level Supabase client to bypass RLS for AI inserts.
  Generates AI cartoon cover images via Pollinations.
*/

export const runtime = "nodejs";
export const maxDuration = 120;

// ── AI Cartoon Image Generation (Gemini 2.5 Flash Image) ──

const CARTOON_STYLE = "colorful cartoon illustration, Amul topical ad style, vibrant colors, bold outlines, editorial cartoon, no text, no watermark";

const CATEGORY_SCENE: Record<string, string> = {
  sports: "stadium crowd cheering, dynamic action pose, sports field",
  politics: "parliament building, political podium, flags waving",
  economy: "stock market charts, coins and currency, city skyline",
  tech: "futuristic gadgets, glowing screens, circuit boards",
  entertainment: "movie camera, stage lights, red carpet",
  society: "diverse crowd, city life, nature and buildings",
  general: "newspaper headlines, globe, magnifying glass",
};

function buildCartoonPrompt(topic: string, category: string): string {
  const scene = CATEGORY_SCENE[category] || CATEGORY_SCENE.general;
  return `${CARTOON_STYLE}, ${topic}, ${scene}`;
}

async function generateCartoonImage(topic: string, category: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = buildCartoonPrompt(topic, category);

  // Store proxy URL — image generated on-demand when browser requests it
  return `/api/whatif-image?prompt=${encodeURIComponent(prompt)}`;
}

// DuckDuckGo instant answer — reliable free image source
async function fetchDuckDuckGoImage(query: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();

    // Check Image field (may be relative URL)
    if (data.Image) {
      if (data.Image.startsWith("http")) return data.Image;
      if (data.Image.startsWith("/")) return `https://duckduckgo.com${data.Image}`;
    }

    // Check related topics for images
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics) {
        if (topic.Icon?.URL && topic.Icon.URL.startsWith("http")) return topic.Icon.URL;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Wikipedia image — very reliable for known entities
async function fetchWikipediaImage(query: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`;
    const res = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.thumbnail?.source) return data.thumbnail.source;
    if (data.originalimage?.source) return data.originalimage.source;
    return null;
  } catch {
    return null;
  }
}

// SSRF protection imported from @/lib/ssrf

// Scrape og:image from a URL (works on most news sites)
async function scrapeOgImage(url: string): Promise<string | null> {
  if (!isSafeUrl(url)) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    // Try og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/i);
    if (ogMatch?.[1] && ogMatch[1].startsWith("http")) return ogMatch[1];

    // Try twitter:image
    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twMatch?.[1] && twMatch[1].startsWith("http")) return twMatch[1];

    // Try any large image
    const imgMatches = [...html.matchAll(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)];
    for (const m of imgMatches) {
      if (/logo|icon|favicon|avatar|badge|pixel|1x1|sprite/i.test(m[1])) continue;
      return m[1];
    }

    return null;
  } catch {
    return null;
  }
}

// Generate What-Ifs for all major regions — each gets locally relevant trends
const GEOS = [
  { geo: "IN", country: "in" },
  { geo: "US", country: "us" },
  { geo: "GB", country: "gb" },
  { geo: "DE", country: "de" },
  { geo: "FR", country: "fr" },
  { geo: "JP", country: "jp" },
  { geo: "AU", country: "au" },
  { geo: "BR", country: "br" },
  { geo: "CA", country: "ca" },
];

export async function GET(req: NextRequest) {
  // ── Auth check (required in ALL environments) ──
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured (missing service role key)" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: { geo: string; generated: number; skipped: number; error?: string }[] = [];

  for (const { geo, country } of GEOS) {
    try {
      // Fetch current trending topics
      const trends = await fetchGoogleTrends(geo);
      if (!trends || trends.length === 0) {
        results.push({ geo, generated: 0, skipped: 0, error: "No trends returned" });
        continue;
      }

      // Check which trends already have scenarios (dedup by source_trend)
      const trendTitles = trends.map((t) => t.title);
      const { data: existing } = await supabase
        .from("scenarios")
        .select("source_trend")
        .in("source_trend", trendTitles);

      const existingTrends = new Set((existing || []).map((s) => s.source_trend));
      const newTrends = trends.filter((t) => !existingTrends.has(t.title));

      if (newTrends.length === 0) {
        results.push({ geo, generated: 0, skipped: trends.length });
        continue;
      }

      // Generate scenarios from new trends (max 5 per geo per run)
      const scenarios = generateScenarios(newTrends.slice(0, 5), country);

      let generated = 0;
      for (const scenario of scenarios) {
        const { outcomes, body, content_type, read_time, ...rest } = scenario;

        // Generate AI cartoon cover image via Pollinations
        let cover_image: string | null = null;
        try {
          cover_image = await generateCartoonImage(rest.source_trend, scenario.category);
        } catch { /* non-critical — cards have SVG fallback */ }

        // Insert scenario with body, content_type, and cover image
        const { data: inserted, error: insertErr } = await supabase
          .from("scenarios")
          .insert({ ...rest, body, content_type, read_time, cover_image })
          .select("id")
          .single();

        if (insertErr || !inserted) {
          console.error("[whatif-cron] Insert error:", insertErr);
          continue;
        }

        // Insert outcomes — delete scenario if this fails to avoid broken state
        const outcomeRows = outcomes.map((o) => ({
          scenario_id: inserted.id,
          label: o.label,
          description: o.description || null,
        }));

        const { error: outcomeErr } = await supabase.from("outcomes").insert(outcomeRows);
        if (outcomeErr) {
          console.error("[whatif-cron] Outcome insert failed, removing scenario:", outcomeErr);
          await supabase.from("scenarios").delete().eq("id", inserted.id);
          continue;
        }
        generated++;
      }

      results.push({ geo, generated, skipped: existingTrends.size });
    } catch (err) {
      results.push({ geo, generated: 0, skipped: 0, error: String(err).slice(0, 100) });
    }
  }

  // Keep DB clean — archive scenarios older than 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("scenarios")
    .update({ status: "archived" })
    .eq("is_ai_generated", true)
    .eq("status", "active")
    .lt("created_at", weekAgo);

  return NextResponse.json({ status: "completed", results });
}
