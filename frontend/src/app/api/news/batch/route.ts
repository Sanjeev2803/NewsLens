import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { cachedFetch } from "@/lib/cache";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/* eslint-disable @typescript-eslint/no-explicit-any */

/*
  Batch news endpoint — fetches multiple countries in a single request.
  Used by the homepage NewsPulseMap to avoid 12 parallel API calls.

  Uses a separate cache key prefix ("batch:") so it doesn't conflict
  with the full single-country endpoint (which includes trends, enrichment, etc.).

  GET /api/news/batch?countries=in,us,gb,jp&max=3
*/

const ALL_COUNTRIES = ["in", "us", "gb", "jp", "au", "ca", "de", "fr", "br", "cn", "ru", "za"];
const ALLOWED_CATEGORIES = ["general", "business", "technology", "science", "health", "sports", "entertainment"];
const ALLOWED_LANGS = ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "ur", "ja", "de", "fr", "pt", "zh", "ru"];

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many requests", retryAfter: retryAfterSec },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  const { searchParams } = req.nextUrl;
  const countriesParam = searchParams.get("countries");
  const countries = countriesParam
    ? countriesParam.split(",").filter((c) => ALL_COUNTRIES.includes(c))
    : ALL_COUNTRIES;
  const max = Math.min(parseInt(searchParams.get("max") || "3", 10) || 3, 10);
  const rawCategory = searchParams.get("category") || "general";
  const category = ALLOWED_CATEGORIES.includes(rawCategory) ? rawCategory : "general";
  const rawLang = searchParams.get("lang") || "en";
  const lang = ALLOWED_LANGS.includes(rawLang) ? rawLang : "en";

  try {
    const results = await Promise.allSettled(
      countries.map((country) => {
        const cacheKey = `batch:${category}:${country}:${lang}`;
        return cachedFetch(
          cacheKey,
          () => fetchAllNews({ category, country, lang, max: 10 }),
          { ttlMs: 3 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 }
        ).then((data) => ({
          country,
          articles: (data.articles || []).slice(0, max),
          totalArticles: data.articles?.length || 0,
          freshCount: data.freshCount || 0,
          sources: data.sources || [],
        }));
      })
    );

    const batch: Record<string, any> = {};
    const failed: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        batch[r.value.country] = r.value;
      } else {
        failed.push(countries[i]);
      }
    }

    return NextResponse.json(
      { ...batch, _meta: { failed, fetchedAt: Date.now() } },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    console.error("Batch news error:", err);
    return NextResponse.json(
      { error: "Failed to fetch batch news" },
      { status: 500 }
    );
  }
}
