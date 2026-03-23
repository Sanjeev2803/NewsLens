import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { LANGUAGE_STATE_MAP, fetchGoogleTrends, getRegionalGeo, fetchRegionalFeeds } from "@/lib/regionalSources";
import { cachedFetch, getCacheStats, setCacheEntry } from "@/lib/cache";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { enrichArticleImages } from "@/lib/imageEnrich";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Track which cache keys have been enriched to avoid duplicate background work
// Capped at 100 entries to prevent unbounded growth in long-lived instances
const MAX_ENRICHED_KEYS = 100;
const enrichedKeys = new Set<string>();

const COUNTRIES_MAP: Record<string, string> = {
  in: "india", us: "united states", gb: "united kingdom", jp: "japan",
  au: "australia", ca: "canada", de: "germany", fr: "france",
  br: "brazil", cn: "china", ru: "russia", za: "south africa",
};
const ALLOWED_COUNTRIES = Object.keys(COUNTRIES_MAP);
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

        // ── Freshness filter ──
        const now = Date.now();
        const MAX_AGE_REGIONAL = 24 * 60 * 60 * 1000;
        const MAX_AGE_GLOBAL = 48 * 60 * 60 * 1000;

        const freshRegional = regionalResult.articles.filter((a: any) => {
          const age = now - new Date(a.publishedAt).getTime();
          return age < MAX_AGE_REGIONAL && age >= 0;
        });

        const freshGlobal = globalResult.articles.filter((a: any) => {
          const age = now - new Date(a.publishedAt).getTime();
          return age < MAX_AGE_GLOBAL && age >= 0;
        });

        // ── Regional filtering ──
        let filteredGlobal = freshGlobal;
        if (isRegionalIndian && freshRegional.length >= 3) {
          const regionStates = LANGUAGE_STATE_MAP[lang]?.states || [];
          const regionKeywords = [
            country.toUpperCase(),
            ...regionStates.map((s: string) => s.toLowerCase()),
            "india", "indian",
          ];
          filteredGlobal = freshGlobal.filter((a: any) => {
            const text = `${a.title} ${a.description} ${a.source?.name || ""}`.toLowerCase();
            return regionKeywords.some((kw) => text.includes(kw));
          });
          if (filteredGlobal.length < 2) {
            filteredGlobal = freshGlobal.slice(0, 3);
          }
        } else if (category === "nation" && country !== "in") {
          const countryLabel = (COUNTRIES_MAP[country] || country).toLowerCase();
          filteredGlobal = freshGlobal.filter((a: any) => {
            const text = `${a.title} ${a.description} ${a.source?.name || ""}`.toLowerCase();
            return text.includes(countryLabel);
          });
          if (filteredGlobal.length < 2) filteredGlobal = freshGlobal.slice(0, 5);
        }

        // ── Deduplicate ──
        const allArticles = [...freshRegional, ...filteredGlobal];
        const seen = new Set<string>();
        const unique = allArticles.filter((a: any) => {
          if (!a.title) return false;
          const k = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        // ── Sort: images first, then by date ──
        unique.sort((a: any, b: any) => {
          if (a.image && !b.image) return -1;
          if (!a.image && b.image) return 1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        const allSources = [...new Set([...regionalResult.sources, ...globalResult.sources])];
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const freshCount = unique.filter((a: any) => new Date(a.publishedAt).getTime() > oneHourAgo).length;

        return {
          articles: unique.slice(0, 30),
          totalArticles: unique.length,
          freshCount,
          sources: allSources,
          trending: trends.slice(0, 12),
          region: isRegionalIndian ? LANGUAGE_STATE_MAP[lang].states.join(", ") : null,
        };
      },
      { ttlMs: 3 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 }
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
          await setCacheEntry(cacheKey, enrichedPayload, { ttlMs: 3 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 });
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
