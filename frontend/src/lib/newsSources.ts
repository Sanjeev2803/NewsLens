/*
  Multi-Source News Aggregator — 10 sources with automatic fallback

  FREE (no key needed):
    1. Google News RSS — unlimited, supports country/lang/category
    2. BBC RSS — free, reliable, has media:thumbnail images
    3. Reuters RSS — free, global coverage
    4. Al Jazeera RSS — free, international
    5. Times of India RSS — free, India focus, has enclosure images

  API KEY (free tier):
    6. GNews — 100 req/day
    7. NewsData.io — 200 credits/day
    8. Currents API — 600 req/day
    9. NewsAPI.org — 100 req/day (dev only)
    10. The Guardian — 5000 req/day (generous)
*/

import { XMLParser } from "fast-xml-parser";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["item", "entry"].includes(tagName),
});

// ── Common Types ──

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

export interface FetchParams {
  category: string;
  country: string;
  lang: string;
  max: number;
}

// ── Image Extraction Helpers ──

function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractRSSImage(item: any): string | null {
  // media:thumbnail (BBC uses this)
  if (item["media:thumbnail"]) {
    const mt = item["media:thumbnail"];
    if (typeof mt === "string") return mt;
    if (mt["@_url"]) return mt["@_url"];
    if (Array.isArray(mt) && mt[0]?.["@_url"]) return mt[0]["@_url"];
  }

  // media:content (some feeds use this)
  if (item["media:content"]) {
    const mc = item["media:content"];
    if (mc["@_url"]) return mc["@_url"];
    if (Array.isArray(mc) && mc[0]?.["@_url"]) return mc[0]["@_url"];
  }

  // enclosure (TOI uses this)
  if (item.enclosure) {
    const enc = item.enclosure;
    if (enc["@_url"]) return enc["@_url"];
    if (typeof enc === "string") return enc;
  }

  // Try extracting from description HTML
  const descImg = extractImageFromHtml(item.description || item["content:encoded"] || "");
  if (descImg) return descImg;

  return null;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── OG Image Fetcher (for articles without images) ──

async function fetchOGImage(articleUrl: string): Promise<string | null> {
  try {
    // Skip Google News redirect URLs
    if (articleUrl.includes("news.google.com")) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsLens/1.0)" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    // Only read first 20KB to find og:image
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 20000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    // Look for og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch) return ogMatch[1];

    // Fallback to twitter:image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

// ── Google News RSS (Source 1 — PRIMARY, free, unlimited) ──

const GOOGLE_NEWS_TOPICS: Record<string, string> = {
  general: "",
  nation: "CAAqIggKIhxDQkFTRHdvSkwyMHZNRFZxYUdjU0FtVnVLQUFQAQ",
  world: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pKVGlnQVAB",
  sports: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pKVGlnQVAB",
  entertainment: "CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pKVGlnQVAB",
  technology: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB",
  business: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pKVGlnQVAB",
  science: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pKVGlnQVAB",
  health: "CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ",
};

const GOOGLE_COUNTRY_MAP: Record<string, { gl: string }> = {
  in: { gl: "IN" }, us: { gl: "US" }, gb: { gl: "GB" }, jp: { gl: "JP" },
  au: { gl: "AU" }, ca: { gl: "CA" }, de: { gl: "DE" }, fr: { gl: "FR" },
  br: { gl: "BR" }, cn: { gl: "CN" }, ru: { gl: "RU" }, za: { gl: "ZA" },
};

const GOOGLE_LANG_MAP: Record<string, string> = {
  en: "en", hi: "hi", ta: "ta", te: "te", mr: "mr", bn: "bn",
  gu: "gu", kn: "kn", ml: "ml", pa: "pa", ur: "ur",
  fr: "fr", de: "de", ja: "ja", zh: "zh-Hans", es: "es", pt: "pt-419", ar: "ar",
};

export async function fetchGoogleNews(params: FetchParams): Promise<NewsArticle[]> {
  const topicId = GOOGLE_NEWS_TOPICS[params.category] || "";
  const countryInfo = GOOGLE_COUNTRY_MAP[params.country] || GOOGLE_COUNTRY_MAP.in;
  const hl = GOOGLE_LANG_MAP[params.lang] || "en";

  let url: string;
  if (topicId) {
    url = `https://news.google.com/rss/topics/${topicId}?hl=${hl}&gl=${countryInfo.gl}&ceid=${countryInfo.gl}:${hl}`;
  } else {
    url = `https://news.google.com/rss?hl=${hl}&gl=${countryInfo.gl}&ceid=${countryInfo.gl}:${hl}`;
  }

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Google News RSS: ${res.status}`);

  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item || [];
  const arr = Array.isArray(items) ? items : [items];

  const articles = arr.slice(0, params.max).map((item: Record<string, any>) => {
    const sourceName = typeof item.source === "object"
      ? item.source["#text"] || "Google News"
      : String(item.source || "Google News");
    const sourceUrl = typeof item.source === "object" ? item.source["@_url"] || "" : "";

    return {
      title: String(item.title || "").replace(/ - .*$/, ""),
      description: String(item.description || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").slice(0, 300),
      url: item.link || "",
      image: extractRSSImage(item),
      publishedAt: item.pubDate || new Date().toISOString(),
      source: { name: sourceName, url: sourceUrl },
    };
  });

  // For Google News articles without images, try fetching OG images
  // from the source website (limit to 5 concurrent to avoid slowdown)
  const needImages = articles.filter((a) => !a.image).slice(0, 5);
  if (needImages.length > 0) {
    const ogResults = await Promise.allSettled(
      needImages.map(async (a) => {
        // Google News URLs redirect — try the source URL domain's article
        // Skip google redirect URLs, fetch from source website
        const targetUrl = a.url.includes("news.google.com") ? a.source.url : a.url;
        if (!targetUrl || targetUrl.length < 10) return null;
        return fetchOGImage(targetUrl);
      })
    );
    needImages.forEach((a, i) => {
      const r = ogResults[i];
      if (r.status === "fulfilled" && r.value) {
        a.image = r.value;
      }
    });
  }

  return articles;
}

// ── RSS Feed Sources (Sources 2-5 — free, no key) ──

// Country-specific RSS feeds
const COUNTRY_RSS: Record<string, { name: string; url: string }[]> = {
  in: [
    { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms" },
    { name: "BBC India", url: "https://feeds.bbci.co.uk/news/world/south_asia/rss.xml" },
  ],
  us: [
    { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
    { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
    { name: "BBC US", url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml" },
  ],
  gb: [
    { name: "BBC UK", url: "https://feeds.bbci.co.uk/news/uk/rss.xml" },
    { name: "The Guardian", url: "https://www.theguardian.com/uk/rss" },
    { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/uk.xml" },
  ],
  ca: [
    { name: "CBC News", url: "https://www.cbc.ca/webfeed/rss/rss-topstories" },
    { name: "CTV News", url: "https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009" },
    { name: "BBC Canada", url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml" },
  ],
  au: [
    { name: "ABC Australia", url: "https://www.abc.net.au/news/feed/2942460/rss.xml" },
    { name: "BBC Australia", url: "https://feeds.bbci.co.uk/news/world/australia/rss.xml" },
    { name: "SBS News", url: "https://www.sbs.com.au/news/feed" },
  ],
  jp: [
    { name: "Japan Times", url: "https://www.japantimes.co.jp/feed/" },
    { name: "NHK World", url: "https://www3.nhk.or.jp/rss/news/cat0.xml" },
    { name: "BBC Asia", url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml" },
  ],
  de: [
    { name: "DW News", url: "https://rss.dw.com/rdf/rss-en-all" },
    { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },
  ],
  fr: [
    { name: "France 24", url: "https://www.france24.com/en/rss" },
    { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },
  ],
  br: [
    { name: "BBC Latin America", url: "https://feeds.bbci.co.uk/news/world/latin_america/rss.xml" },
  ],
  cn: [
    { name: "BBC Asia", url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml" },
    { name: "SCMP", url: "https://www.scmp.com/rss/91/feed" },
  ],
  ru: [
    { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },
  ],
  za: [
    { name: "BBC Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml" },
    { name: "News24", url: "https://feeds.news24.com/articles/News24/TopStories/rss" },
  ],
};

const CATEGORY_RSS: Record<string, { name: string; url: string }[]> = {
  sports: [
    { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
    { name: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  ],
  technology: [
    { name: "BBC Tech", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
    { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  ],
  entertainment: [
    { name: "BBC Entertainment", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
  ],
  business: [
    { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  ],
  science: [
    { name: "BBC Science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
  ],
  health: [
    { name: "BBC Health", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  ],
  world: [
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  ],
  nation: [
    { name: "BBC", url: "https://feeds.bbci.co.uk/news/rss.xml" },
  ],
};

function getRSSFeeds(category: string, country: string): { name: string; url: string }[] {
  // Category-specific feeds
  if (category !== "general" && CATEGORY_RSS[category]) {
    // Add country-specific feeds too for context
    return [...(CATEGORY_RSS[category] || []), ...(COUNTRY_RSS[country]?.slice(0, 1) || [])];
  }
  // General: use country-specific feeds
  return COUNTRY_RSS[country] || COUNTRY_RSS.in;
}

async function fetchSingleRSS(feedUrl: string, sourceName: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch(feedUrl, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const arr = Array.isArray(items) ? items : [items];

    return arr.slice(0, 8).map((item: any) => {
      const image = extractRSSImage(item);
      const link = typeof item.link === "object" ? item.link["@_href"] || "" : String(item.link || item.guid || "");

      return {
        title: String(item.title || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, ""),
        description: String(item.description || item.summary || item.content || "")
          .replace(/<!\[CDATA\[|\]\]>/g, "")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, "&")
          .slice(0, 300),
        url: link,
        image,
        publishedAt: item.pubDate || item.published || item.updated || new Date().toISOString(),
        source: { name: sourceName, url: "" },
      };
    });
  } catch {
    return [];
  }
}

export async function fetchRSSFeeds(params: FetchParams): Promise<NewsArticle[]> {
  const feeds = getRSSFeeds(params.category, params.country);
  const results = await Promise.allSettled(
    feeds.map((f) => fetchSingleRSS(f.url, f.name))
  );
  const articles: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return articles.slice(0, params.max);
}

// ── GNews API (Source 6) ──

export async function fetchGNews(params: FetchParams): Promise<NewsArticle[]> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return [];

  const url = `https://gnews.io/api/v4/top-headlines?category=${params.category}&lang=${params.lang}&country=${params.country}&max=${params.max}&apikey=${key}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.articles || []).map((a: any) => ({
    title: a.title || "",
    description: a.description || "",
    url: a.url || "",
    image: a.image || null,
    publishedAt: a.publishedAt || new Date().toISOString(),
    source: { name: a.source?.name || "GNews", url: a.source?.url || "" },
  }));
}

// ── NewsData.io (Source 7) ──

const NEWSDATA_CATEGORIES: Record<string, string> = {
  general: "top", nation: "politics", world: "world", sports: "sports",
  entertainment: "entertainment", technology: "technology", business: "business",
  science: "science", health: "health",
};

export async function fetchNewsData(params: FetchParams): Promise<NewsArticle[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return [];

  const cat = NEWSDATA_CATEGORIES[params.category] || "top";
  const url = `https://newsdata.io/api/1/latest?apikey=${key}&country=${params.country}&language=${params.lang}&category=${cat}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).slice(0, params.max).map((a: any) => ({
    title: a.title || "",
    description: a.description || "",
    url: a.link || "",
    image: a.image_url || null,
    publishedAt: a.pubDate || new Date().toISOString(),
    source: { name: a.source_id || "NewsData", url: a.source_url || "" },
  }));
}

// ── Currents API (Source 8) ──

export async function fetchCurrentsAPI(params: FetchParams): Promise<NewsArticle[]> {
  const key = process.env.CURRENTS_API_KEY;
  if (!key) return [];

  const url = `https://api.currentsapi.services/v1/latest-news?apiKey=${key}&language=${params.lang}&country=${params.country}&category=${params.category}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.news || []).slice(0, params.max).map((a: any) => ({
    title: a.title || "",
    description: a.description || "",
    url: a.url || "",
    image: a.image && a.image !== "None" ? a.image : null,
    publishedAt: a.published || new Date().toISOString(),
    source: { name: a.author || "Currents", url: "" },
  }));
}

// ── NewsAPI.org (Source 9) ──

export async function fetchNewsAPIOrg(params: FetchParams): Promise<NewsArticle[]> {
  const key = process.env.NEWSAPI_ORG_KEY;
  if (!key) return [];

  const url = `https://newsapi.org/v2/top-headlines?country=${params.country}&category=${params.category}&pageSize=${params.max}&apiKey=${key}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.articles || []).slice(0, params.max).map((a: any) => ({
    title: a.title || "",
    description: a.description || "",
    url: a.url || "",
    image: a.urlToImage || null,
    publishedAt: a.publishedAt || new Date().toISOString(),
    source: { name: a.source?.name || "NewsAPI", url: "" },
  }));
}

// ── The Guardian (Source 10) ──

const GUARDIAN_SECTIONS: Record<string, string> = {
  general: "news", nation: "world/india", world: "world", sports: "sport",
  entertainment: "culture", technology: "technology", business: "business",
  science: "science", health: "society",
};

export async function fetchGuardian(params: FetchParams): Promise<NewsArticle[]> {
  const key = process.env.GUARDIAN_API_KEY;
  if (!key) return [];

  const section = GUARDIAN_SECTIONS[params.category] || "news";
  const url = `https://content.guardianapis.com/search?section=${section}&show-fields=thumbnail,trailText&page-size=${params.max}&order-by=newest&api-key=${key}`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.response?.results || []).slice(0, params.max).map((a: any) => ({
    title: a.webTitle || "",
    description: a.fields?.trailText || "",
    url: a.webUrl || "",
    image: a.fields?.thumbnail || null,
    publishedAt: a.webPublicationDate || new Date().toISOString(),
    source: { name: "The Guardian", url: "https://www.theguardian.com" },
  }));
}

// ── Master Aggregator with Fallback Chain ──

export async function fetchAllNews(params: FetchParams): Promise<{
  articles: NewsArticle[];
  sources: string[];
  freshCount: number;
}> {
  const allArticles: NewsArticle[] = [];
  const activeSources: string[] = [];

  // Tier 1: Free sources (always available, no key needed)
  const tier1 = await Promise.allSettled([
    fetchGoogleNews(params).then((a) => ({ name: "Google News", articles: a })),
    fetchRSSFeeds(params).then((a) => ({ name: "RSS Feeds (BBC/TOI/AJ)", articles: a })),
  ]);

  for (const r of tier1) {
    if (r.status === "fulfilled" && r.value.articles.length > 0) {
      allArticles.push(...r.value.articles);
      activeSources.push(r.value.name);
    }
  }

  // Tier 2: API sources (need keys, used as enrichment/backup)
  const tier2 = await Promise.allSettled([
    fetchGNews(params).then((a) => ({ name: "GNews", articles: a })),
    fetchNewsData(params).then((a) => ({ name: "NewsData.io", articles: a })),
    fetchCurrentsAPI(params).then((a) => ({ name: "Currents API", articles: a })),
    fetchNewsAPIOrg(params).then((a) => ({ name: "NewsAPI.org", articles: a })),
    fetchGuardian(params).then((a) => ({ name: "The Guardian", articles: a })),
  ]);

  for (const r of tier2) {
    if (r.status === "fulfilled" && r.value.articles.length > 0) {
      allArticles.push(...r.value.articles);
      activeSources.push(r.value.name);
    }
  }

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    if (!a.title) return false;
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: articles WITH images first, then by date
  unique.sort((a, b) => {
    // Prioritize articles with images
    if (a.image && !b.image) return -1;
    if (!a.image && b.image) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Count fresh articles (within last hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const freshCount = unique.filter((a) => new Date(a.publishedAt).getTime() > oneHourAgo).length;

  return {
    articles: unique.slice(0, Math.max(params.max, 15)),
    sources: activeSources,
    freshCount,
  };
}
