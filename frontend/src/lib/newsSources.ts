/*
  Multi-Source News Aggregator — all free RSS, no API keys needed.

  Source 1: Google News RSS — unlimited, supports country/lang/category
  Source 2: RSS Feeds — 20+ feeds across countries and categories:
    India: TOI, BBC India, Hindustan Times, Indian Express, The Hindu, Economic Times, NDTV
    US: NPR, CBS, BBC US, NYT
    UK: BBC UK, The Guardian, Sky News
    Categories: BBC Sport, ESPN, ESPNcricinfo, TechCrunch, Wired, The Verge,
                Variety, Deadline, Hollywood Reporter, MarketWatch, ScienceDaily,
                Nature, Al Jazeera, Guardian World, Independent, Sky News World
*/

import { XMLParser } from "fast-xml-parser";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["item", "entry"].includes(tagName),
});

// ── Global concurrency limiter — prevents flooding external servers on cold cache ──
const MAX_CONCURRENT_FETCHES = 6;
let activeFetches = 0;
const fetchQueue: (() => void)[] = [];

const MAX_QUEUE_SIZE = 50;

function throttledFetch(url: string, options?: RequestInit): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    function run() {
      activeFetches++;
      fetch(url, options)
        .then(resolve, reject)
        .finally(() => {
          activeFetches--;
          if (fetchQueue.length > 0) fetchQueue.shift()!();
        });
    }
    if (activeFetches < MAX_CONCURRENT_FETCHES) {
      run();
    } else if (fetchQueue.length < MAX_QUEUE_SIZE) {
      fetchQueue.push(run);
    } else {
      reject(new Error("Fetch queue full"));
    }
  });
}

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

  const res = await throttledFetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Google News RSS: ${res.status}`);

  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item || [];
  const arr = Array.isArray(items) ? items : [items];

  return arr.slice(0, params.max).map((item: Record<string, any>) => {
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
}

// ── RSS Feed Sources (Sources 2-5 — free, no key) ──

// Country-specific RSS feeds
const COUNTRY_RSS: Record<string, { name: string; url: string }[]> = {
  in: [
    { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms" },
    { name: "BBC India", url: "https://feeds.bbci.co.uk/news/world/south_asia/rss.xml" },
    { name: "Hindustan Times", url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml" },
    { name: "Indian Express", url: "https://indianexpress.com/section/india/feed/" },
    { name: "The Hindu", url: "https://www.thehindu.com/news/national/feeder/default.rss" },
    { name: "Economic Times", url: "https://economictimes.indiatimes.com/rssfeedstopstories.cms" },
    { name: "NDTV", url: "https://feeds.feedburner.com/ndtv/latest" },
  ],
  us: [
    { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
    { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/main" },
    { name: "BBC US", url: "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml" },
    { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
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
    { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  ],
  cn: [
    { name: "BBC Asia", url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml" },
    { name: "SCMP", url: "https://www.scmp.com/rss/91/feed" },
  ],
  ru: [
    { name: "BBC Europe", url: "https://feeds.bbci.co.uk/news/world/europe/rss.xml" },
    { name: "The Independent", url: "https://www.independent.co.uk/news/world/rss" },
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
    { name: "BBC Cricket", url: "https://feeds.bbci.co.uk/sport/cricket/rss.xml" },
    { name: "ESPNcricinfo", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml" },
  ],
  technology: [
    { name: "BBC Tech", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
    { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
    { name: "TechCrunch", url: "https://feeds.feedburner.com/TechCrunch/" },
    { name: "Wired", url: "https://www.wired.com/feed/rss" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  ],
  entertainment: [
    { name: "BBC Entertainment", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" },
    { name: "Variety", url: "https://variety.com/feed/" },
    { name: "Deadline", url: "https://deadline.com/feed/" },
    { name: "Hollywood Reporter", url: "https://www.hollywoodreporter.com/feed/" },
  ],
  business: [
    { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
    { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  ],
  science: [
    { name: "BBC Science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
    { name: "ScienceDaily", url: "https://www.sciencedaily.com/rss/all.xml" },
    { name: "Nature", url: "https://www.nature.com/nature.rss" },
  ],
  health: [
    { name: "BBC Health", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  ],
  world: [
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
    { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
    { name: "The Independent", url: "https://www.independent.co.uk/news/world/rss" },
    { name: "Sky News World", url: "https://feeds.skynews.com/feeds/rss/world.xml" },
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
    const res = await throttledFetch(feedUrl);
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


// ── Quality Filter — remove vague, clickbait, low-depth articles ──

function isQualityArticle(a: NewsArticle): boolean {
  // Must have a real title (not too short)
  if (!a.title || a.title.trim().length < 25) return false;
  // Must have meaningful description
  if (!a.description || a.description.trim().length < 50) return false;
  // Title shouldn't equal description (lazy duplication)
  if (a.title.trim() === a.description.trim()) return false;
  // Filter clickbait / non-article patterns
  const junk = /^(watch|video:|photos:|gallery:|slideshow|quiz|poll|live updates|live blog|\[removed\]|\[deleted\]|subscribe|sign up)/i;
  if (junk.test(a.title.trim())) return false;
  // Filter ultra-short "headline only" articles
  if (a.description.split(/\s+/).length < 8) return false;
  // Filter articles with no real URL
  if (!a.url || a.url.length < 15) return false;
  return true;
}

// ── Master Aggregator with Fallback Chain ──

export async function fetchAllNews(params: FetchParams): Promise<{
  articles: NewsArticle[];
  sources: string[];
  freshCount: number;
}> {
  const allArticles: NewsArticle[] = [];
  const activeSources: string[] = [];

  const allResults = await Promise.allSettled([
    fetchGoogleNews(params).then((a) => ({ name: "Google News", articles: a })),
    fetchRSSFeeds(params).then((a) => ({ name: "RSS Feeds", articles: a })),
  ]);

  for (const r of allResults) {
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

  // Quality filter — remove vague, shallow, clickbait articles
  const quality = unique.filter(isQualityArticle);

  // Sort: articles WITH images first, then by date
  quality.sort((a, b) => {
    // Prioritize articles with images
    if (a.image && !b.image) return -1;
    if (!a.image && b.image) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Count fresh articles (within last hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const freshCount = quality.filter((a) => new Date(a.publishedAt).getTime() > oneHourAgo).length;

  return {
    articles: quality.slice(0, Math.max(params.max, 15)),
    sources: activeSources,
    freshCount,
  };
}
