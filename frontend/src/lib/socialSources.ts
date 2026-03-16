/*
  Social/Trending Sources — alternatives to X/Twitter
  All free, no API keys required

  1. Reddit — trending posts from news/regional subreddits
  2. Bluesky — open AT Protocol public search
  3. YouTube Trending — RSS feeds
  4. Wikipedia Most Read — what people are searching
*/

export interface SocialPost {
  title: string;
  text: string;
  url: string;
  image: string | null;
  author: string;
  platform: "reddit" | "bluesky" | "youtube" | "wikipedia";
  score: number; // upvotes / engagement
  timestamp: string;
  comments?: number;
}

// ── Reddit (Source 1) ──

const REDDIT_SUBS: Record<string, string[]> = {
  // India regional — deep coverage
  in_ta: ["chennai", "tamil", "tamilnadu", "kollywood", "PlipPlip", "CricketShitpost"],
  in_te: ["hyderabad", "telugu", "Ni_Bondha", "tollywood", "Andhra", "telangana"],
  in_hi: ["india", "IndiaSpeaks", "indianews", "bollywood", "delhi", "UttarPradesh"],
  in_bn: ["kolkata", "bengali", "WestBengal", "IndianFootball"],
  in_mr: ["mumbai", "pune", "maharashtra", "MarathiPeople"],
  in_kn: ["bangalore", "karnataka", "KannadaCinema", "bengaluru_speaks"],
  in_ml: ["kerala", "kochi", "Lal_Salaam", "MalayalamMovies"],
  in_gu: ["ahmedabad", "gujarat", "surat"],
  in_pa: ["punjab", "sikh", "ABCDesis"],
  in_ur: ["pakistan", "hyderabad", "india"],
  in_en: ["india", "IndiaSpeaks", "indianews", "bollywood", "Cricket", "IndianGaming"],

  // International — deep country coverage
  us_en: ["news", "politics", "usanews", "AmericanPolitics", "technology", "worldnews", "nba", "nfl"],
  gb_en: ["unitedkingdom", "ukpolitics", "CasualUK", "BritishProblems", "soccer", "london"],
  jp_en: ["japan", "japanlife", "newsokur", "japannews", "anime", "JapanTravel"],
  au_en: ["australia", "AustralianPolitics", "melbourne", "sydney", "AFL", "NRL"],
  ca_en: ["canada", "onguardforthee", "CanadaPolitics", "toronto", "vancouver", "hockey", "canadanews"],
  de_en: ["germany", "de", "berlin", "Munich", "bundesliga"],
  fr_en: ["france", "rance", "paris", "Ligue1", "europe"],
  br_en: ["brazil", "brasilivre", "futebol", "saopaulo"],
  cn_en: ["China", "worldnews", "Sino", "HongKong"],
  ru_en: ["worldnews", "UkrainianConflict", "europe"],
  za_en: ["southafrica", "capetown", "johannesburg"],

  // Category-specific — thorough
  sports: ["sports", "soccer", "Cricket", "nba", "formula1", "tennis", "olympics", "MMA", "boxing"],
  entertainment: ["movies", "television", "bollywood", "tollywood", "kollywood", "anime", "Music", "popculture", "celebrities"],
  technology: ["technology", "programming", "gadgets", "android", "apple", "MachineLearning", "artificial", "startups"],
  business: ["business", "economy", "stocks", "IndianStreetBets", "wallstreetbets", "finance", "cryptocurrency"],
  science: ["science", "space", "Futurology", "EverythingScience", "physics"],
  health: ["health", "Fitness", "medicine", "nutrition", "MentalHealth"],
  world: ["worldnews", "geopolitics", "GlobalTalk", "anime_titties"],
  nation: ["india", "IndiaSpeaks", "indianews"],
};

function getRedditSubs(country: string, lang: string, category: string): string[] {
  // Category-specific subs
  if (category !== "general" && category !== "nation" && category !== "world") {
    return REDDIT_SUBS[category] || REDDIT_SUBS.sports;
  }

  // Regional subs
  const key = `${country}_${lang}`;
  if (REDDIT_SUBS[key]) return REDDIT_SUBS[key];

  // Country fallback
  const countryKey = `${country}_en`;
  if (REDDIT_SUBS[countryKey]) return REDDIT_SUBS[countryKey];

  return ["worldnews", "news"];
}

export async function fetchRedditTrending(
  country: string,
  lang: string,
  category: string,
  limit: number = 10
): Promise<SocialPost[]> {
  const subs = getRedditSubs(country, lang, category);
  const results: SocialPost[] = [];

  // Fetch top posts from each subreddit (parallel) — use more subs
  const fetches = subs.slice(0, 6).map(async (sub) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=8&raw_json=1`,
        {
          signal: controller.signal,
          headers: { "User-Agent": "NewsLens/1.0" },
          next: { revalidate: 300 },
        }
      );
      clearTimeout(timeout);
      if (!res.ok) return [];

      const data = await res.json();
      const posts = data?.data?.children || [];

      return posts
        .filter((p: { data: { stickied: boolean } }) => !p.data.stickied)
        .map((p: { data: Record<string, unknown> }) => {
          const d = p.data;
          const preview = d.preview as { images?: Array<{ source?: { url?: string }; resolutions?: Array<{ url?: string; width?: number }> }> } | undefined;

          // Always prefer high-res source image over blurry thumbnail
          const sourceImg = preview?.images?.[0]?.source?.url;
          // Fallback: pick the highest resolution available
          const resolutions = preview?.images?.[0]?.resolutions || [];
          const bestRes = resolutions.length > 0 ? resolutions[resolutions.length - 1]?.url : null;
          // Last resort: thumbnail (blurry, avoid if possible)
          const thumbnail = d.thumbnail && String(d.thumbnail).startsWith("http") ? String(d.thumbnail) : null;

          const image = (sourceImg || bestRes || thumbnail || null);

          return {
            title: String(d.title || ""),
            text: String(d.selftext || "").slice(0, 200),
            url: d.url_overridden_by_dest
              ? String(d.url_overridden_by_dest)
              : `https://reddit.com${d.permalink}`,
            image: image ? String(image).replace(/&amp;/g, "&") : null,
            author: `r/${sub} · u/${d.author}`,
            platform: "reddit" as const,
            score: Number(d.score) || 0,
            timestamp: new Date(Number(d.created_utc) * 1000).toISOString(),
            comments: Number(d.num_comments) || 0,
          };
        });
    } catch {
      return [];
    }
  });

  const settled = await Promise.allSettled(fetches);
  for (const r of settled) {
    if (r.status === "fulfilled") results.push(...r.value);
  }

  // Sort by score (most upvoted = most trending)
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ── Bluesky (Source 2) — AT Protocol public search ──

export async function fetchBlueskyTrending(
  query: string,
  limit: number = 8
): Promise<SocialPost[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Public search endpoint — no auth needed
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${limit}&sort=top`,
      {
        signal: controller.signal,
        next: { revalidate: 300 },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    const posts = data?.posts || [];

    return posts.map((post: Record<string, unknown>) => {
      const record = post.record as Record<string, unknown>;
      const author = post.author as Record<string, string>;
      const embed = post.embed as Record<string, unknown> | undefined;
      const images = embed?.images as Array<{ thumb?: string }> | undefined;

      return {
        title: String(record?.text || "").slice(0, 120),
        text: String(record?.text || ""),
        url: `https://bsky.app/profile/${author?.handle}/post/${String(post.uri).split("/").pop()}`,
        image: images?.[0]?.thumb || null,
        author: `@${author?.handle || "unknown"}`,
        platform: "bluesky" as const,
        score: Number((post as Record<string, number>).likeCount) || 0,
        timestamp: String(record?.createdAt || new Date().toISOString()),
        comments: Number((post as Record<string, number>).replyCount) || 0,
      };
    });
  } catch {
    return [];
  }
}

// ── YouTube Trending (Source 3) ──

const YT_COUNTRY_MAP: Record<string, string> = {
  in: "IN", us: "US", gb: "GB", jp: "JP", au: "AU", ca: "CA",
  de: "DE", fr: "FR", br: "BR", cn: "CN", ru: "RU", za: "ZA",
};

export async function fetchYouTubeTrending(country: string): Promise<SocialPost[]> {
  try {
    const gl = YT_COUNTRY_MAP[country] || "IN";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // YouTube trending RSS
    const res = await fetch(
      `https://www.youtube.com/feeds/trending?gl=${gl}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsLens/1.0)" },
        next: { revalidate: 600 },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const text = await res.text();

    // Parse entries from Atom feed
    const entries: SocialPost[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(text)) !== null && entries.length < 8) {
      const entry = match[1];
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = entry.match(/<link[^>]+href="([^"]+)"/)?.[1] || "";
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || "";
      const author = entry.match(/<name>(.*?)<\/name>/)?.[1] || "";
      const videoId = link.match(/v=([^&]+)/)?.[1] || "";

      entries.push({
        title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
        text: "",
        url: link,
        image: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
        author: `YouTube · ${author}`,
        platform: "youtube",
        score: 0,
        timestamp: published || new Date().toISOString(),
      });
    }

    return entries;
  } catch {
    return [];
  }
}

// ── Wikipedia Most Read (Source 4) ──

export async function fetchWikipediaTrending(lang: string = "en"): Promise<SocialPost[]> {
  try {
    const wikiLang = lang === "ta" ? "ta" : lang === "te" ? "te" : lang === "hi" ? "hi" :
      lang === "bn" ? "bn" : lang === "mr" ? "mr" : lang === "kn" ? "kn" :
      lang === "ml" ? "ml" : lang === "gu" ? "gu" : lang === "pa" ? "pa" :
      lang === "ur" ? "ur" : lang === "ja" ? "ja" : lang === "zh" ? "zh" :
      lang === "fr" ? "fr" : lang === "de" ? "de" : lang === "es" ? "es" :
      lang === "pt" ? "pt" : lang === "ar" ? "ar" : "en";

    const yesterday = new Date(Date.now() - 86400000);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://${wikiLang}.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`,
      {
        signal: controller.signal,
        next: { revalidate: 3600 },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    const articles = data?.mostread?.articles || [];

    return articles.slice(0, 8).map((a: Record<string, unknown>) => {
      const thumb = a.thumbnail as { source?: string; width?: number } | undefined;
      // Upgrade Wikipedia thumbnail to higher resolution (replace /NNNpx- with /800px-)
      let image = thumb?.source || null;
      if (image && image.includes("/thumb/")) {
        image = image.replace(/\/\d+px-/, "/800px-");
      }
      const orig = a.originalimage as { source?: string } | undefined;
      if (orig?.source) image = orig.source; // Use original full-res if available

      return {
        title: String(a.normalizedtitle || a.title || ""),
        text: String((a as Record<string, string>).extract || "").slice(0, 200),
        url: String((a as Record<string, { desktop?: string }>).content_urls?.desktop || ""),
        image,
        author: "Wikipedia",
        platform: "wikipedia" as const,
        score: Number(a.views) || 0,
        timestamp: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

// ── Bluesky search queries by region ──

const BLUESKY_QUERIES: Record<string, string> = {
  in_ta: "Tamil Nadu OR Chennai OR Kollywood OR Vijay OR DMK",
  in_te: "Hyderabad OR Telugu OR Tollywood OR Telangana OR AP",
  in_hi: "India news OR Delhi OR Bollywood OR Modi OR Hindi",
  in_bn: "Kolkata OR Bengal OR Mamata",
  in_mr: "Mumbai OR Maharashtra OR Marathi OR Pune",
  in_kn: "Bangalore OR Karnataka OR Kannada",
  in_ml: "Kerala OR Malayalam OR Kochi",
  in_en: "India news breaking trending",
  us_en: "USA news breaking America politics",
  gb_en: "UK news breaking Britain London",
  ca_en: "Canada news Toronto Ottawa breaking",
  au_en: "Australia news Sydney Melbourne breaking",
  jp_en: "Japan news Tokyo breaking",
  de_en: "Germany news Berlin breaking",
  fr_en: "France news Paris breaking",
  br_en: "Brazil news breaking",
  cn_en: "China news breaking",
  ru_en: "Russia news breaking",
  za_en: "South Africa news breaking",
};

export function getBlueskyQuery(country: string, lang: string, category: string): string {
  if (category === "sports") return "sports cricket football";
  if (category === "entertainment") return "movies entertainment celebrity";
  if (category === "technology") return "tech AI startup";
  if (category === "business") return "business economy markets";

  const key = `${country}_${lang}`;
  return BLUESKY_QUERIES[key] || BLUESKY_QUERIES[`${country}_en`] || "breaking news";
}

// ── Master Social Aggregator ──

export async function fetchAllSocial(
  country: string,
  lang: string,
  category: string
): Promise<{
  posts: SocialPost[];
  platforms: string[];
}> {
  const bskyQuery = getBlueskyQuery(country, lang, category);

  const [reddit, bluesky, youtube, wikipedia] = await Promise.allSettled([
    fetchRedditTrending(country, lang, category, 8),
    fetchBlueskyTrending(bskyQuery, 6),
    fetchYouTubeTrending(country),
    fetchWikipediaTrending(lang),
  ]);

  const posts: SocialPost[] = [];
  const platforms: string[] = [];

  // Interleave platforms — take top from each, don't let Wikipedia dominate
  const redditPosts = reddit.status === "fulfilled" ? reddit.value : [];
  const bskyPosts = bluesky.status === "fulfilled" ? bluesky.value : [];
  const ytPosts = youtube.status === "fulfilled" ? youtube.value : [];
  const wikiPosts = wikipedia.status === "fulfilled" ? wikipedia.value : [];

  if (redditPosts.length > 0) platforms.push("Reddit");
  if (bskyPosts.length > 0) platforms.push("Bluesky");
  if (ytPosts.length > 0) platforms.push("YouTube");
  if (wikiPosts.length > 0) platforms.push("Wikipedia");

  // Sort each by score, then interleave: Reddit first (most like X), then others
  redditPosts.sort((a, b) => b.score - a.score);
  const maxLen = Math.max(redditPosts.length, bskyPosts.length, ytPosts.length, wikiPosts.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < redditPosts.length) posts.push(redditPosts[i]);
    if (i < bskyPosts.length) posts.push(bskyPosts[i]);
    if (i < ytPosts.length) posts.push(ytPosts[i]);
    if (i < wikiPosts.length) posts.push(wikiPosts[i]);
  }

  return { posts, platforms };
}
