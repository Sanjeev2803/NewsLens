import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { LANGUAGE_STATE_MAP, fetchGoogleTrends, getRegionalGeo, fetchRegionalFeeds } from "@/lib/regionalSources";
import { cachedFetch, getCacheStats } from "@/lib/cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { enrichArticleImages } from "@/lib/imageEnrich";

/* eslint-disable @typescript-eslint/no-explicit-any */

const COUNTRIES_MAP: Record<string, string> = {
  in: "india", us: "united states", gb: "united kingdom", jp: "japan",
  au: "australia", ca: "canada", de: "germany", fr: "france",
  br: "brazil", cn: "china", ru: "russia", za: "south africa",
};

// GET /api/news?category=general&country=in&lang=en&max=10
export async function GET(req: NextRequest) {
  // ── Rate limiting ──
  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp);
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
  const category = searchParams.get("category") || "general";
  const country = searchParams.get("country") || "in";
  const lang = searchParams.get("lang") || "en";
  const max = parseInt(searchParams.get("max") || "10", 10);

  // Cache diagnostics endpoint
  if (searchParams.get("_cache") === "status") {
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

        const enrichedArticles = await enrichArticleImages(unique.slice(0, 30));

        return {
          articles: enrichedArticles,
          totalArticles: unique.length,
          freshCount,
          sources: allSources,
          trending: trends.slice(0, 12),
          region: isRegionalIndian ? LANGUAGE_STATE_MAP[lang].states.join(", ") : null,
        };
      },
      { ttlMs: 3 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 }
    );

    return NextResponse.json(
      { ...result, articles: result.articles.slice(0, max) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    console.error("News fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch news", details: String(err), articles: [], sources: [], trending: [] },
      { status: 500 }
    );
  }
}
