/*
  Regional Indian News Sources — mapped by language to state-level feeds
  + Google Trends for real-time trending topics
*/

// ── Regional RSS Feeds by Language ──
// Each language maps to news sources from the states where that language is spoken

export interface RegionalFeed {
  name: string;
  url: string;
  state: string; // Primary state
}

export const REGIONAL_FEEDS: Record<string, RegionalFeed[]> = {
  // Telugu → Andhra Pradesh, Telangana
  te: [
    { name: "Eenadu", url: "https://www.eenadu.net/telugu-news/rss/telangana-news", state: "Telangana" },
    { name: "Sakshi", url: "https://www.sakshi.com/rss/telangana", state: "Telangana" },
    { name: "TV9 Telugu", url: "https://www.tv9telugu.com/rss", state: "AP/Telangana" },
    { name: "Andhra Jyoti", url: "https://www.andhrajyothy.com/rss", state: "Andhra Pradesh" },
    { name: "NTV Telugu", url: "https://ntvtelugu.com/feed", state: "AP/Telangana" },
  ],

  // Tamil → Tamil Nadu, Puducherry
  ta: [
    { name: "Dinamalar", url: "https://www.dinamalar.com/rss/RSSFeed.aspx", state: "Tamil Nadu" },
    { name: "Dinakaran", url: "https://www.dinakaran.com/rssfeed.aspx", state: "Tamil Nadu" },
    { name: "Vikatan", url: "https://www.vikatan.com/rss", state: "Tamil Nadu" },
    { name: "The Hindu Tamil", url: "https://www.hindutamil.in/rss", state: "Tamil Nadu" },
    { name: "News18 Tamil", url: "https://tamil.news18.com/rss/kab-tak.xml", state: "Tamil Nadu" },
  ],

  // Hindi → UP, MP, Rajasthan, Bihar, Delhi, etc.
  hi: [
    { name: "NDTV Hindi", url: "https://feeds.feedburner.com/ndtvkhabar", state: "National Hindi" },
    { name: "Aaj Tak", url: "https://www.aajtak.in/rss/india-news", state: "National Hindi" },
    { name: "Navbharat Times", url: "https://navbharattimes.indiatimes.com/rssfeedsdefault.cms", state: "National Hindi" },
    { name: "Dainik Bhaskar", url: "https://www.bhaskar.com/rss-v1--category-1061.xml", state: "MP/Rajasthan" },
    { name: "Hindustan", url: "https://feed.livehindustan.com/rss/3127", state: "UP/Bihar" },
  ],

  // Bengali → West Bengal, Tripura
  bn: [
    { name: "Anandabazar", url: "https://www.anandabazar.com/rss/all-stories", state: "West Bengal" },
    { name: "Ei Samay", url: "https://eisamay.indiatimes.com/rssfeedsdefault.cms", state: "West Bengal" },
    { name: "Sangbad Pratidin", url: "https://www.sangbadpratidin.in/feed/", state: "West Bengal" },
    { name: "ABP Ananda", url: "https://bengali.abplive.com/rss", state: "West Bengal" },
  ],

  // Marathi → Maharashtra
  mr: [
    { name: "Loksatta", url: "https://www.loksatta.com/feed/", state: "Maharashtra" },
    { name: "Maharashtra Times", url: "https://maharashtratimes.com/rssfeedsdefault.cms", state: "Maharashtra" },
    { name: "ABP Majha", url: "https://marathi.abplive.com/rss", state: "Maharashtra" },
    { name: "Sakal", url: "https://www.esakal.com/rss", state: "Maharashtra" },
  ],

  // Kannada → Karnataka
  kn: [
    { name: "Vijaya Karnataka", url: "https://vijaykarnataka.com/rssfeedsdefault.cms", state: "Karnataka" },
    { name: "Prajavani", url: "https://www.prajavani.net/rss", state: "Karnataka" },
    { name: "Udayavani", url: "https://www.udayavani.com/rss", state: "Karnataka" },
    { name: "TV9 Kannada", url: "https://www.tv9kannada.com/rss", state: "Karnataka" },
  ],

  // Malayalam → Kerala
  ml: [
    { name: "Mathrubhumi", url: "https://www.mathrubhumi.com/rss/news", state: "Kerala" },
    { name: "Manorama", url: "https://www.manoramaonline.com/rss/news", state: "Kerala" },
    { name: "Asianet News", url: "https://www.asianetnews.com/rss", state: "Kerala" },
    { name: "Deshabhimani", url: "https://www.deshabhimani.com/rss", state: "Kerala" },
  ],

  // Gujarati → Gujarat
  gu: [
    { name: "Gujarat Samachar", url: "https://www.gujaratsamachar.com/rss", state: "Gujarat" },
    { name: "Divya Bhaskar", url: "https://www.divyabhaskar.co.in/rss-v1--category-1740.xml", state: "Gujarat" },
    { name: "Sandesh", url: "https://www.sandesh.com/rss", state: "Gujarat" },
  ],

  // Punjabi → Punjab
  pa: [
    { name: "Jagbani", url: "https://www.jagbani.com/rss", state: "Punjab" },
    { name: "Ajit Daily", url: "https://www.ajitjalandhar.com/rss", state: "Punjab" },
    { name: "Rozana Spokesman", url: "https://www.rozanaspokesman.com/rss", state: "Punjab" },
  ],

  // Urdu → J&K, UP, Telangana
  ur: [
    { name: "Siasat Daily", url: "https://www.siasat.com/feed/", state: "Telangana" },
    { name: "Inquilab", url: "https://www.inquilab.com/rss", state: "Maharashtra" },
    { name: "Munsif Daily", url: "https://www.munsif.com/feed/", state: "Telangana" },
  ],
};

// ── State mapping for each language ──

export const LANGUAGE_STATE_MAP: Record<string, { states: string[]; geoCode: string }> = {
  te: { states: ["Andhra Pradesh", "Telangana"], geoCode: "IN-TG" },
  ta: { states: ["Tamil Nadu", "Puducherry"], geoCode: "IN-TN" },
  hi: { states: ["Delhi", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Bihar"], geoCode: "IN-DL" },
  bn: { states: ["West Bengal", "Tripura"], geoCode: "IN-WB" },
  mr: { states: ["Maharashtra", "Goa"], geoCode: "IN-MH" },
  kn: { states: ["Karnataka"], geoCode: "IN-KA" },
  ml: { states: ["Kerala"], geoCode: "IN-KL" },
  gu: { states: ["Gujarat"], geoCode: "IN-GJ" },
  pa: { states: ["Punjab", "Haryana"], geoCode: "IN-PB" },
  ur: { states: ["Jammu & Kashmir", "Telangana"], geoCode: "IN-JK" },
};

// ── Google Trends (Real-time trending topics) ──

export interface TrendingTopic {
  title: string;
  traffic: string;
  relatedQueries: string[];
  url: string;
}

export async function fetchGoogleTrends(geo: string = "IN"): Promise<TrendingTopic[]> {
  try {
    const url = `https://trends.google.com/trending/rss?geo=${geo}`;
    const res = await fetch(url, {
      next: { revalidate: 300 }, // 5 min cache
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsLens/1.0)" },
    });
    if (!res.ok) return [];

    const xml = await res.text();

    // Parse trending topics from RSS
    const topics: TrendingTopic[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "";
      const traffic = item.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const newsItems = item.match(/<ht:news_item_title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:news_item_title>/g) || [];

      topics.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, ""),
        traffic,
        relatedQueries: newsItems.map((n) =>
          n.replace(/<\/?ht:news_item_title>/g, "").replace(/<!\[CDATA\[|\]\]>/g, "").trim()
        ).slice(0, 3),
        url: link,
      });
    }

    return topics;
  } catch {
    return [];
  }
}

// ── Country-specific trending ──

const COUNTRY_GEO_MAP: Record<string, string> = {
  in: "IN", us: "US", gb: "GB", jp: "JP", au: "AU", ca: "CA",
  de: "DE", fr: "FR", br: "BR", cn: "CN", ru: "RU", za: "ZA",
};

export function getGeoForCountry(country: string): string {
  return COUNTRY_GEO_MAP[country] || "IN";
}

// ── Get regional geo for Indian language ──

export function getRegionalGeo(lang: string, country: string): string {
  if (country === "in" && LANGUAGE_STATE_MAP[lang]) {
    return LANGUAGE_STATE_MAP[lang].geoCode;
  }
  return getGeoForCountry(country);
}
