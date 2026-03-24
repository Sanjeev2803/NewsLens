import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { fetchAllSocial } from "@/lib/socialSources";
import { fetchGoogleTrends, getRegionalGeo, getGeoForCountry, fetchRegionalFeeds, LANGUAGE_STATE_MAP } from "@/lib/regionalSources";
import { setCacheEntry } from "@/lib/cache";
import { enrichArticleImages } from "@/lib/imageEnrich";
import { assembleNewsFeed } from "@/lib/newsAssemble";

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
  Cron cache warmer — pre-fetches news, social, and trends for popular combos.

  Triggered by:
  - Vercel Cron (vercel.json: schedule every 3 minutes)
  - External cron (curl http://localhost:3000/api/cron/warm-cache)
  - Manual trigger for testing

  Populates the cache so user requests hit warm data instead of cold-fetching.
  Also runs image enrichment inline (not in the request path).

  Protected by CRON_SECRET in production to prevent abuse.
*/

export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 120s for parallel pre-fetching

// Most popular country+lang combos to pre-fetch
const WARM_COMBOS = [
  { country: "in", lang: "en", category: "general" },
  { country: "in", lang: "ta", category: "general" },
  { country: "in", lang: "te", category: "general" },
  { country: "in", lang: "hi", category: "general" },
  { country: "us", lang: "en", category: "general" },
  { country: "gb", lang: "en", category: "general" },
];

const NEWS_TTL = { ttlMs: 3 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 };
const SOCIAL_TTL = { ttlMs: 5 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 };

export async function GET(req: NextRequest) {
  // ── Auth check — required in production, optional in dev ──
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") {
    console.error("[cron] CRON_SECRET not set — refusing to run unprotected in production");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startTime = Date.now();

  // Process all combos in parallel to avoid 120s timeout
  const comboResults = await Promise.allSettled(
    WARM_COMBOS.map(async ({ country, lang, category }) => {
      const label = `${category}:${country}:${lang}`;
      const comboStart = Date.now();

      try {
        const isRegionalIndian = country === "in" && LANGUAGE_STATE_MAP[lang];

        // ── Parallel fetch: global news + regional feeds + trends ──
        const [globalResult, regionalResult, trends] = await Promise.all([
          fetchAllNews({ category, country, lang, max: 30 }),
          isRegionalIndian ? fetchRegionalFeeds(lang, 30) : Promise.resolve({ articles: [], sources: [] }),
          fetchGoogleTrends(isRegionalIndian ? getRegionalGeo(lang, country) : getGeoForCountry(country)),
        ]);

        const cachePayload = assembleNewsFeed({
          globalArticles: globalResult.articles as any[],
          regionalArticles: regionalResult.articles as any[],
          trends,
          country,
          lang,
          category,
        });

        // ── Image enrichment (inline, not in request path) ──
        const enriched = await enrichArticleImages([...cachePayload.articles]);
        cachePayload.articles = enriched;

        // ── Write to cache ──
        await setCacheEntry(`news:${category}:${country}:${lang}`, cachePayload, NEWS_TTL);

        // ── Social feed (optional) ──
        try {
          const socialData = await fetchAllSocial(country, lang, category);
          await setCacheEntry(`social:${category}:${country}:${lang}`, socialData, SOCIAL_TTL);
        } catch {
          // Social is optional — don't fail the combo
        }

        return { combo: label, status: "ok", ms: Date.now() - comboStart };
      } catch (err) {
        return { combo: label, status: `error: ${String(err).slice(0, 100)}`, ms: Date.now() - comboStart };
      }
    })
  );

  const results = comboResults.map((r) =>
    r.status === "fulfilled" ? r.value : { combo: "unknown", status: "rejected", ms: 0 }
  );

  return NextResponse.json({
    status: "completed",
    totalMs: Date.now() - startTime,
    results,
  });
}
