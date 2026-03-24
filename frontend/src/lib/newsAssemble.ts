/*
  Shared news assembly logic used by both:
  - /api/news (user request path, with cachedFetch)
  - /api/cron/warm-cache (cron pre-fetcher, writes directly to cache)

  Handles: freshness filtering, regional filtering, dedup, sort.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

import { LANGUAGE_STATE_MAP } from "@/lib/regionalSources";

const COUNTRIES_MAP: Record<string, string> = {
  in: "india", us: "united states", gb: "united kingdom", jp: "japan",
  au: "australia", ca: "canada", de: "germany", fr: "france",
  br: "brazil", cn: "china", ru: "russia", za: "south africa",
};

const MAX_AGE_REGIONAL = 24 * 60 * 60 * 1000;
const MAX_AGE_GLOBAL = 48 * 60 * 60 * 1000;

interface AssembleInput {
  globalArticles: any[];
  regionalArticles: any[];
  trends: any[];
  country: string;
  lang: string;
  category: string;
}

export function assembleNewsFeed({
  globalArticles,
  regionalArticles,
  trends,
  country,
  lang,
  category,
}: AssembleInput) {
  const now = Date.now();
  const isRegionalIndian = country === "in" && !!LANGUAGE_STATE_MAP[lang];

  // Freshness filter
  const freshRegional = regionalArticles.filter((a: any) => {
    const age = now - new Date(a.publishedAt).getTime();
    return age < MAX_AGE_REGIONAL && age >= 0;
  });

  const freshGlobal = globalArticles.filter((a: any) => {
    const age = now - new Date(a.publishedAt).getTime();
    return age < MAX_AGE_GLOBAL && age >= 0;
  });

  // Regional filtering
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
    if (filteredGlobal.length < 2) filteredGlobal = freshGlobal.slice(0, 3);
  } else if (category === "nation" && country !== "in") {
    const countryLabel = (COUNTRIES_MAP[country] || country).toLowerCase();
    filteredGlobal = freshGlobal.filter((a: any) => {
      const text = `${a.title} ${a.description} ${a.source?.name || ""}`.toLowerCase();
      return text.includes(countryLabel);
    });
    if (filteredGlobal.length < 2) filteredGlobal = freshGlobal.slice(0, 5);
  }

  // Deduplicate
  const allArticles = [...freshRegional, ...filteredGlobal];
  const seen = new Set<string>();
  const unique = allArticles.filter((a: any) => {
    if (!a.title) return false;
    const k = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Sort: images first, then by date
  unique.sort((a: any, b: any) => {
    if (a.image && !b.image) return -1;
    if (!a.image && b.image) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const allSources = [...new Set([
    ...(regionalArticles.length > 0 ? regionalArticles.map((a: any) => a.source?.name).filter(Boolean) : []),
    ...globalArticles.map((a: any) => a.source?.name).filter(Boolean),
  ])];
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
}
