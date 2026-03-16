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

// ── Known logo/icon/branding URL patterns — these are NOT real news images ──
const LOGO_PATTERNS = [
  /logo/i, /favicon/i, /icon[-_.]?/i, /brand/i, /avatar/i,
  /default[-_]?image/i, /placeholder/i, /no[-_]?image/i,
  /sprite/i, /widget/i, /badge/i,
  /1x1/i, /pixel/i, /spacer/i,
];

function isLikelyLogoUrl(url: string): boolean {
  if (LOGO_PATTERNS.some((p) => p.test(url))) return true;
  // Catch known generic og:images from Indian news sites
  if (/OG[-_]?section|thehindu\.com\/theme|indiatoday\.in\/assets/i.test(url)) return true;
  return false;
}

// ── Scrape the REAL article image from the page HTML ──
// Strategy: look for og:image first, then twitter:image, then the largest <img> in the article
async function scrapeArticleImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    const decoder = new TextDecoder();
    // Read up to 100KB to catch images that may be below the fold
    while (html.length < 100000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    // 1. Try og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/i);
    const ogUrl = ogMatch?.[1];

    // 2. Try twitter:image
    const twMatch = html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i);
    const twUrl = twMatch?.[1];

    // 3. Find large images in article body as fallback
    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)];
    const candidateImgs = imgMatches
      .map((m) => {
        const src = m[1];
        const full = m[0];
        // Check for width/height attributes to estimate size
        const wMatch = full.match(/width=["']?(\d+)/i);
        const hMatch = full.match(/height=["']?(\d+)/i);
        const w = wMatch ? parseInt(wMatch[1]) : 0;
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        return { src, w, h };
      })
      .filter((img) => {
        if (!img.src || img.src.startsWith("data:")) return false;
        if (isLikelyLogoUrl(img.src)) return false;
        // If we know dimensions, must be reasonably large
        if (img.w > 0 && img.w < 300) return false;
        if (img.h > 0 && img.h < 200) return false;
        return true;
      })
      .sort((a, b) => (b.w * b.h) - (a.w * a.h));

    // Pick the best candidate — prefer og:image but ONLY if it's not a logo
    // We check by seeing if it looks like a real unique article URL (has path segments, not just a domain logo)
    const isRealArticleImage = (imgUrl: string) => {
      if (!imgUrl) return false;
      if (isLikelyLogoUrl(imgUrl)) return false;
      // If URL path has very few segments, it's likely a site-wide default
      try {
        const u = new URL(imgUrl.startsWith("//") ? "https:" + imgUrl : imgUrl);
        const pathParts = u.pathname.split("/").filter(Boolean);
        // Site-wide logos usually live at short paths like /image/logo.png
        // Article images usually have longer paths with dates/IDs
        if (pathParts.length <= 2) {
          // Short path — check if filename looks generic
          const filename = pathParts[pathParts.length - 1] || "";
          if (/^(default|og|OG|share|social|thumb|cover|banner|section|generic|placeholder|common)/i.test(filename)) return false;
        }
        return true;
      } catch {
        return true; // can't parse, assume it's ok
      }
    };

    if (ogUrl && isRealArticleImage(ogUrl)) return ogUrl;
    if (twUrl && isRealArticleImage(twUrl)) return twUrl;
    if (candidateImgs.length > 0) return candidateImgs[0].src;
    // Last resort: return og:image even if it might be a logo — still better than nothing
    // Actually NO — if it's a logo, null is better so the frontend uses category fallback
    return null;
  } catch {
    return null;
  }
}

// ── Image search fallback — use Bing Image Search (more scrape-friendly than Google) ──
async function searchImageForHeadline(query: string): Promise<string | null> {
  try {
    const searchQuery = encodeURIComponent(query.slice(0, 100) + " news");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Try Bing Image Search
    const res = await fetch(
      `https://www.bing.com/images/search?q=${searchQuery}&form=HDRSC2&first=1`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();

    // Bing embeds image data in "murl" (media URL) parameters
    const murlMatches = [...html.matchAll(/murl[&quot;]*[=:][&quot;]*["']?(https?:\/\/[^"'&]+\.(?:jpg|jpeg|png|webp)[^"'&]*)/gi)];
    for (const m of murlMatches) {
      const url = decodeURIComponent(m[1]);
      if (/logo|icon|favicon|avatar|badge|pixel|1x1|spacer/i.test(url)) continue;
      return url;
    }

    // Fallback: look for image URLs in img tags with large sizes
    const imgTagMatches = [...html.matchAll(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)];
    for (const m of imgTagMatches) {
      const url = m[1];
      if (/bing\.com|microsoft\.com|logo|icon|favicon|avatar|badge/i.test(url)) continue;
      if (url.includes("th?id=")) continue; // Bing thumbnails — too small
      return url;
    }

    // Try Bing's thumbnail URLs as last resort (they are actually decent quality)
    const tbnMatches = [...html.matchAll(/src=["'](https?:\/\/tse\d+\.mm\.bing\.net\/th\?[^"']+)["']/gi)];
    if (tbnMatches.length > 0) {
      return tbnMatches[0][1];
    }

    return null;
  } catch {
    return null;
  }
}

// ── Enrich ALL articles — detect duplicate/branding images and replace with real ones ──
async function enrichArticleImages(articles: any[]): Promise<any[]> {
  // STEP 1: Detect duplicate images — if the same image URL appears on 2+ articles, it's a site-wide logo
  const imageCounts = new Map<string, number>();
  for (const a of articles) {
    if (a.image) {
      // Normalize: strip query params for comparison
      const normalized = a.image.split("?")[0];
      imageCounts.set(normalized, (imageCounts.get(normalized) || 0) + 1);
    }
  }
  const duplicateImages = new Set<string>();
  for (const [img, count] of imageCounts) {
    if (count >= 2) duplicateImages.add(img);
  }

  // STEP 2: Mark articles that need real images
  const needsImage: number[] = [];
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a.image) { needsImage.push(i); continue; }
    if (isLikelyLogoUrl(a.image)) { needsImage.push(i); continue; }
    // Duplicate image = branding/logo shared across articles
    const normalized = a.image.split("?")[0];
    if (duplicateImages.has(normalized)) { needsImage.push(i); continue; }
  }

  if (needsImage.length === 0) return articles;

  // STEP 3: Scrape real images from article pages in parallel
  const results = await Promise.allSettled(
    needsImage.map((idx) => scrapeArticleImage(articles[idx].url))
  );

  // Collect scraped images to also check for duplicates among them
  const scrapedUrls = new Map<string, string>();
  const stillNeedsImage: number[] = [];
  for (let j = 0; j < needsImage.length; j++) {
    const r = results[j];
    if (r.status === "fulfilled" && r.value) {
      const normalized = r.value.split("?")[0];
      if (!scrapedUrls.has(normalized)) {
        scrapedUrls.set(normalized, r.value);
        articles[needsImage[j]].image = r.value;
      } else {
        articles[needsImage[j]].image = null;
        stillNeedsImage.push(needsImage[j]);
      }
    } else {
      articles[needsImage[j]].image = null;
      stillNeedsImage.push(needsImage[j]);
    }
  }

  // STEP 4: Google Image Search fallback for articles STILL without images
  if (stillNeedsImage.length > 0) {
    const googleResults = await Promise.allSettled(
      stillNeedsImage.map((idx) => searchImageForHeadline(articles[idx].title))
    );
    for (let k = 0; k < stillNeedsImage.length; k++) {
      const gr = googleResults[k];
      if (gr.status === "fulfilled" && gr.value) {
        articles[stillNeedsImage[k]].image = gr.value;
      }
    }
  }

  return articles;
}

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

    // Enrich: fetch real images for articles missing them (scrapes og:image from article URLs)
    const finalArticles = await enrichArticleImages(unique.slice(0, Math.max(max, 15)));

    return NextResponse.json({
      articles: finalArticles,
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
