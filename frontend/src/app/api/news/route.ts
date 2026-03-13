import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { REGIONAL_FEEDS, LANGUAGE_STATE_MAP, fetchGoogleTrends, getRegionalGeo } from "@/lib/regionalSources";
import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["item", "entry"].includes(tagName),
});

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Fetch regional Indian RSS feeds ──
async function fetchRegionalFeeds(lang: string, max: number) {
  const feeds = REGIONAL_FEEDS[lang];
  if (!feeds || feeds.length === 0) return { articles: [], sources: [] };

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(feed.url, {
          signal: controller.signal,
          next: { revalidate: 120 },
          headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsLens/1.0)" },
        });
        clearTimeout(timeout);
        if (!res.ok) return [];

        const text = await res.text();

        // Try XML parsing
        try {
          const parsed = xmlParser.parse(text);
          const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
          const arr = Array.isArray(items) ? items : [items];

          return arr.slice(0, 5).map((item: any) => {
            // Extract image
            const image =
              item["media:thumbnail"]?.["@_url"] ||
              (Array.isArray(item["media:thumbnail"]) ? item["media:thumbnail"][0]?.["@_url"] : null) ||
              item["media:content"]?.["@_url"] ||
              (Array.isArray(item["media:content"]) ? item["media:content"][0]?.["@_url"] : null) ||
              item.enclosure?.["@_url"] ||
              item.description?.match?.(/<img[^>]+src=["']([^"']+)["']/)?.[1] ||
              null;

            const link = typeof item.link === "object" ? item.link["@_href"] || "" : String(item.link || item.guid || "");

            return {
              title: String(item.title || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, ""),
              description: String(item.description || item.summary || "")
                .replace(/<!\[CDATA\[|\]\]>/g, "")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, "&")
                .slice(0, 300),
              url: link,
              image,
              publishedAt: item.pubDate || item.published || item.updated || new Date().toISOString(),
              source: { name: `${feed.name} (${feed.state})`, url: "" },
            };
          });
        } catch {
          return [];
        }
      } catch {
        return [];
      }
    })
  );

  const articles: any[] = [];
  const activeSources: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled" && r.value.length > 0) {
      articles.push(...r.value);
      activeSources.push(`${feeds[i].name} (${feeds[i].state})`);
    }
  }

  // Sort by date
  articles.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return { articles: articles.slice(0, max), sources: activeSources };
}

// GET /api/news?category=general&country=in&lang=en&max=10
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || "general";
  const country = searchParams.get("country") || "in";
  const lang = searchParams.get("lang") || "en";
  const max = parseInt(searchParams.get("max") || "10", 10);

  try {
    // Determine if this is a regional Indian language request
    const isRegionalIndian = country === "in" && LANGUAGE_STATE_MAP[lang];

    // Fetch from all sources in parallel
    const [globalResult, regionalResult, trends] = await Promise.all([
      // Global multi-source fetch
      fetchAllNews({ category, country, lang, max }),

      // Regional feeds (only for Indian languages)
      isRegionalIndian ? fetchRegionalFeeds(lang, max) : Promise.resolve({ articles: [], sources: [] }),

      // Google Trends for the region
      fetchGoogleTrends(isRegionalIndian ? getRegionalGeo(lang, country) : country.toUpperCase()),
    ]);

    // Merge articles: regional first (if available), then global
    const allArticles = [...regionalResult.articles, ...globalResult.articles];

    // Deduplicate
    const seen = new Set<string>();
    const unique = allArticles.filter((a: any) => {
      if (!a.title) return false;
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: images first, then by date
    unique.sort((a: any, b: any) => {
      if (a.image && !b.image) return -1;
      if (!a.image && b.image) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Merge sources
    const allSources = [...new Set([...regionalResult.sources, ...globalResult.sources])];

    // Count fresh
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const freshCount = unique.filter((a: any) => new Date(a.publishedAt).getTime() > oneHourAgo).length;

    return NextResponse.json({
      articles: unique.slice(0, Math.max(max, 15)),
      totalArticles: unique.length,
      freshCount,
      sources: allSources,
      trending: trends.slice(0, 12),
      region: isRegionalIndian ? LANGUAGE_STATE_MAP[lang].states.join(", ") : null,
    });
  } catch (err) {
    console.error("News fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch news", details: String(err), articles: [], sources: [], trending: [] },
      { status: 500 }
    );
  }
}
