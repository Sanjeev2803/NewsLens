import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { LANGUAGE_STATE_MAP, fetchGoogleTrends, getRegionalGeo, fetchRegionalFeeds } from "@/lib/regionalSources";
import { cachedFetch, getCacheStats, setCacheEntry } from "@/lib/cache";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { enrichArticleImages } from "@/lib/imageEnrich";
import { assembleNewsFeed } from "@/lib/newsAssemble";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Track which cache keys have been enriched to avoid duplicate background work
// Capped at 100 entries to prevent unbounded growth in long-lived instances
const MAX_ENRICHED_KEYS = 100;
const enrichedKeys = new Set<string>();

const ALLOWED_COUNTRIES = ["in", "us", "gb", "jp", "au", "ca", "de", "fr", "br", "cn", "ru", "za"];
const ALLOWED_CATEGORIES = ["general", "business", "technology", "science", "health", "sports", "entertainment", "nation"];
const ALLOWED_LANGS = ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "ur", "ja", "de", "fr", "pt", "zh", "ru"];

// GET /api/news?category=general&country=in&lang=en&max=10
export async function GET(req: NextRequest) {
  // ── Rate limiting ──
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many requests", retryAfter: retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  const { searchParams } = req.nextUrl;
  const rawCategory = searchParams.get("category") || "general";
  const rawCountry = searchParams.get("country") || "in";
  const rawLang = searchParams.get("lang") || "en";
  const category = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : "general";
  const country = ALLOWED_COUNTRIES.includes(rawCountry) ? rawCountry : "in";
  const lang = ALLOWED_LANGS.includes(rawLang) ? rawLang : "en";
  const max = Math.min(parseInt(searchParams.get("max") || "10", 10) || 10, 50);

  // Cache diagnostics — dev only
  if (process.env.NODE_ENV === "development" && searchParams.get("_cache") === "status") {
    return NextResponse.json(getCacheStats());
  }


  const cacheKey = `news:${category}:${country}:${lang}`;

  try {
    const result = await cachedFetch(
      cacheKey,
      async () => {
        const isRegionalIndian = country === "in" && LANGUAGE_STATE_MAP[lang];

        const [globalResult, regionalResult, trends] = await Promise.all([
          fetchAllNews({ category, country, lang, max: 30 }),
          isRegionalIndian ? fetchRegionalFeeds(lang, 30) : Promise.resolve({ articles: [], sources: [] }),
          fetchGoogleTrends(isRegionalIndian ? getRegionalGeo(lang, country) : country.toUpperCase()),
        ]);

        return assembleNewsFeed({
          globalArticles: globalResult.articles,
          regionalArticles: regionalResult.articles,
          trends,
          country,
          lang,
          category,
        });
      },
      { ttlMs: 2 * 60 * 1000, staleGraceMs: 2 * 60 * 1000 }
    );

    // ── Background image enrichment (runs after response is sent) ──
    // The cron pre-fetcher handles enrichment for popular combos.
    // For cold misses, enrich via after() so Vercel keeps the function alive.
    if (!enrichedKeys.has(cacheKey)) {
      // Evict oldest key if at capacity
      if (enrichedKeys.size >= MAX_ENRICHED_KEYS) {
        const oldest = enrichedKeys.values().next().value;
        if (oldest) enrichedKeys.delete(oldest);
      }
      enrichedKeys.add(cacheKey);

      // Deep-clone articles to avoid mutating shared cached objects
      const articlesSnapshot = result.articles.map((a: any) => ({ ...a }));
      after(async () => {
        try {
          const enriched = await enrichArticleImages(articlesSnapshot);
          const enrichedPayload = { ...result, articles: enriched };
          await setCacheEntry(cacheKey, enrichedPayload, { ttlMs: 2 * 60 * 1000, staleGraceMs: 2 * 60 * 1000 });
        } catch (err) {
          console.warn("[enrich] background enrichment failed:", err);
        } finally {
          setTimeout(() => enrichedKeys.delete(cacheKey), 3 * 60 * 1000);
        }
      });
    }

    return NextResponse.json(
      { ...result, articles: result.articles.slice(0, max) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    console.error("News fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch news", articles: [], sources: [], trending: [] },
      { status: 500 }
    );
  }
}
