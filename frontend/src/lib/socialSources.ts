/*
  Social/Trending Sources — multi-platform pulse

  1. Reddit — trending posts from news/regional subreddits
  2. Bluesky — open AT Protocol public search
  3. YouTube Trending — RSS feeds
  4. Wikipedia Most Read — what people are searching
  5. Hacker News — tech/startup expert takes (free API)
  6. Threads (Meta) — public search API, growing fast in India
  7. X/Twitter — Nitter RSS instances with fallback chain
*/

export interface SocialPost {
  title: string;
  text: string;
  url: string;
  image: string | null;
  author: string;
  platform: "reddit" | "bluesky" | "youtube" | "wikipedia" | "hackernews" | "threads" | "x";
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
  us_en: ["news", "politics", "usanews", "AmericanPolitics", "technology", "nba", "nfl"],
  gb_en: ["unitedkingdom", "ukpolitics", "CasualUK", "BritishProblems", "soccer", "london"],
  jp_en: ["japan", "japanlife", "newsokur", "japannews", "anime", "JapanTravel"],
  jp_ja: ["japan", "newsokur", "japannews", "lowlevelaware", "anime"],
  au_en: ["australia", "AustralianPolitics", "melbourne", "sydney", "AFL", "NRL"],
  ca_en: ["canada", "onguardforthee", "CanadaPolitics", "toronto", "vancouver", "hockey", "canadanews"],
  de_en: ["germany", "de", "berlin", "Munich", "bundesliga", "europe"],
  de_de: ["de", "ich_iel", "berlin", "Munich", "bundesliga"],
  fr_en: ["france", "paris", "Ligue1", "europe", "French"],
  fr_fr: ["france", "rance", "paris", "Ligue1", "FranceDetendue"],
  br_en: ["brazil", "brasilivre", "futebol", "saopaulo", "riodejaneiro"],
  br_pt: ["brasil", "brasilivre", "futebol", "saopaulo"],
  cn_en: ["China", "Sino", "HongKong", "ChineseHistory"],
  cn_zh: ["China_irl", "real_China_irl", "HongKong"],
  ru_en: ["russia", "AskARussian", "europe", "UkrainianConflict"],
  za_en: ["southafrica", "capetown", "johannesburg", "rugbyunion"],
  es_en: ["spain", "madrid", "barcelona", "LaLiga"],
  es_es: ["es", "spain", "LaLiga", "madrid"],
  it_en: ["italy", "Italia", "SerieA", "rome", "florence"],
  kr_en: ["korea", "hanguk", "kpop", "kdrama", "korean"],
  mx_en: ["mexico", "mujico", "Monterrey", "LigaMX"],
  ar_en: ["argentina", "AskArgentina", "fulbo"],
  ae_en: ["dubai", "UAE", "abudhabi"],
  sa_en: ["saudiarabia", "arabs", "riyadh"],
  eg_en: ["Egypt", "cairo", "arabs"],
  tr_en: ["Turkey", "TurkeyMeta", "istanbul"],

  // Country-specific category subs — so category filtering stays regional
  in_sports: ["Cricket", "IndianSports", "CricketShitpost", "IndianFootball", "formula1india"],
  in_entertainment: ["bollywood", "kollywood", "tollywood", "IndianCinema", "IndianMusic"],
  in_technology: ["developersIndia", "IndianGaming", "startups", "technology"],
  in_business: ["IndianStreetBets", "IndianStockMarket", "economy", "business"],
  us_sports: ["nba", "nfl", "baseball", "MLS", "formula1"],
  us_entertainment: ["movies", "television", "popculture", "Music", "celebrities"],
  us_technology: ["technology", "programming", "gadgets", "MachineLearning", "startups"],
  us_business: ["wallstreetbets", "stocks", "finance", "economy", "business"],
  gb_sports: ["soccer", "PremierLeague", "rugbyunion", "Cricket", "formula1"],
  gb_entertainment: ["movies", "television", "BritishTV", "Music"],

  // Generic category fallbacks (when no country-specific exists)
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
  // Category-specific: try country-specific category subs first, then generic
  if (category !== "general" && category !== "nation" && category !== "world") {
    const countryCatKey = `${country}_${category}`;
    if (REDDIT_SUBS[countryCatKey]) return REDDIT_SUBS[countryCatKey];
    return REDDIT_SUBS[category] || REDDIT_SUBS.sports;
  }

  // Regional subs — try exact lang match, then country fallback
  const key = `${country}_${lang}`;
  if (REDDIT_SUBS[key]) return REDDIT_SUBS[key];

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

          // Use a mid-resolution Reddit image — source images can be huge and OOM the browser
          const resolutions = preview?.images?.[0]?.resolutions || [];
          // Pick a ~640px resolution (index 3-4 out of 0-5 typically)
          const midRes = resolutions.length > 2 ? resolutions[Math.min(3, resolutions.length - 1)]?.url : null;
          const thumbnail = d.thumbnail && String(d.thumbnail).startsWith("http") ? String(d.thumbnail) : null;

          // Gallery posts — Reddit stores images in media_metadata
          let galleryImage: string | null = null;
          const galleryData = d.gallery_data as { items?: Array<{ media_id: string }> } | undefined;
          const mediaMetadata = d.media_metadata as Record<string, { s?: { u?: string } }> | undefined;
          if (galleryData?.items && mediaMetadata) {
            const firstItem = galleryData.items[0];
            const meta = mediaMetadata[firstItem?.media_id];
            if (meta?.s?.u) {
              galleryImage = String(meta.s.u).replace(/&amp;/g, "&");
            }
          }

          // Crosspost fallback
          const crosspostParent = d.crosspost_parent_list as Array<{ preview?: typeof preview }> | undefined;
          const crosspostImg = crosspostParent?.[0]?.preview?.images?.[0]?.resolutions;
          const crosspostMid = crosspostImg && crosspostImg.length > 2 ? crosspostImg[Math.min(3, crosspostImg.length - 1)]?.url : null;

          const image = (midRes || galleryImage || crosspostMid || thumbnail || null);

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
      // Use a capped thumbnail size — original images can be 10,000+ px and OOM the browser
      let image = thumb?.source || null;
      if (image && image.includes("/thumb/")) {
        image = image.replace(/\/\d+px-/, "/400px-");
      }

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
  in_gu: "Gujarat OR Ahmedabad OR Surat",
  in_pa: "Punjab OR Chandigarh OR Sikh",
  in_ur: "Hyderabad OR Lucknow OR Urdu",
  in_en: "India news breaking trending",
  us_en: "USA news breaking America politics",
  gb_en: "UK news breaking Britain London",
  ca_en: "Canada news Toronto Ottawa breaking",
  au_en: "Australia news Sydney Melbourne breaking",
  jp_en: "Japan news Tokyo breaking",
  jp_ja: "日本 ニュース 東京",
  de_en: "Germany news Berlin breaking",
  de_de: "Deutschland Nachrichten Berlin",
  fr_en: "France news Paris breaking",
  fr_fr: "France actualités Paris",
  br_en: "Brazil news breaking",
  br_pt: "Brasil notícias",
  cn_en: "China news breaking",
  cn_zh: "中国 新闻",
  ru_en: "Russia news breaking",
  za_en: "South Africa news breaking",
  es_en: "Spain news Madrid Barcelona breaking",
  es_es: "España noticias Madrid",
  it_en: "Italy news Rome Milan breaking",
  kr_en: "Korea news Seoul K-pop breaking",
  mx_en: "Mexico news breaking",
  ar_en: "Argentina news Buenos Aires breaking",
  ae_en: "UAE Dubai Abu Dhabi news breaking",
  sa_en: "Saudi Arabia Riyadh news breaking",
  eg_en: "Egypt Cairo news breaking",
  tr_en: "Turkey Istanbul news breaking",
};

export function getBlueskyQuery(country: string, lang: string, category: string): string {
  if (category === "sports") return "sports cricket football";
  if (category === "entertainment") return "movies entertainment celebrity";
  if (category === "technology") return "tech AI startup";
  if (category === "business") return "business economy markets";

  const key = `${country}_${lang}`;
  return BLUESKY_QUERIES[key] || BLUESKY_QUERIES[`${country}_en`] || "breaking news";
}

// ── Hacker News (Source 5) — free API, no key needed ──

const HN_CATEGORY_MAP: Record<string, string> = {
  technology: "topstories",
  business: "topstories",
  science: "topstories",
  general: "beststories",
};

export async function fetchHackerNews(
  category: string = "general",
  limit: number = 8
): Promise<SocialPost[]> {
  try {
    const storyType = HN_CATEGORY_MAP[category] || "beststories";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Fetch top story IDs
    const idsRes = await fetch(
      `https://hacker-news.firebaseio.com/v0/${storyType}.json`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!idsRes.ok) return [];

    const ids: number[] = await idsRes.json();
    const topIds = ids.slice(0, limit);

    // Fetch story details in parallel
    const stories = await Promise.allSettled(
      topIds.map(async (id) => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { signal: ctrl.signal }
        );
        clearTimeout(t);
        if (!res.ok) return null;
        return res.json();
      })
    );

    return stories
      .filter((r): r is PromiseFulfilledResult<Record<string, unknown>> =>
        r.status === "fulfilled" && r.value != null && r.value.type === "story"
      )
      .map((r) => {
        const s = r.value;
        return {
          title: String(s.title || ""),
          text: String(s.title || ""),
          url: String(s.url || `https://news.ycombinator.com/item?id=${s.id}`),
          image: null, // HN doesn't have images
          author: `HN · ${s.by || "anon"}`,
          platform: "hackernews" as const,
          score: Number(s.score) || 0,
          timestamp: new Date(Number(s.time) * 1000).toISOString(),
          comments: Number(s.descendants) || 0,
        };
      });
  } catch {
    return [];
  }
}

// ── Threads / Meta (Source 6) — public search ──

/*
  Threads API status: Meta launched the Threads API in June 2024.
  Public post search requires an access token (free, via Meta Developer Portal).
  Without a token, we use the public web search fallback.

  Set THREADS_ACCESS_TOKEN in .env to enable direct API access.
  Without it, falls back to searching via public web endpoints.
*/

export async function fetchThreadsTrending(
  query: string,
  limit: number = 6
): Promise<SocialPost[]> {
  const token = process.env.THREADS_ACCESS_TOKEN;

  if (token) {
    return fetchThreadsViaAPI(query, limit, token);
  }
  // No token — fall back to searching public Threads content via web
  return fetchThreadsViaWeb(query, limit);
}

async function fetchThreadsViaAPI(
  query: string,
  limit: number,
  token: string
): Promise<SocialPost[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Threads API search endpoint
    const res = await fetch(
      `https://graph.threads.net/v1.0/search?q=${encodeURIComponent(query)}&limit=${limit}&fields=id,text,timestamp,username,like_count,reply_count,permalink,media_url,media_type`,
      {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    const posts = data?.data || [];

    return posts.map((p: Record<string, unknown>) => ({
      title: String(p.text || "").slice(0, 120),
      text: String(p.text || ""),
      url: String(p.permalink || `https://threads.net`),
      image: p.media_type === "IMAGE" ? String(p.media_url || "") : null,
      author: `@${p.username || "unknown"}`,
      platform: "threads" as const,
      score: Number(p.like_count) || 0,
      timestamp: String(p.timestamp || new Date().toISOString()),
      comments: Number(p.reply_count) || 0,
    }));
  } catch {
    return [];
  }
}

async function fetchThreadsViaWeb(
  query: string,
  limit: number
): Promise<SocialPost[]> {
  // Fallback: fetch from Threads public profiles via known news handles
  // This is limited but works without auth
  const newsHandles: Record<string, string[]> = {
    india: ["ndtv", "republic", "thehindu", "zeenews", "timesofindia"],
    tech: ["techcrunch", "theverge", "wired", "engadget"],
    general: ["bbc", "cnn", "reuters", "apnews"],
  };

  const handles = newsHandles[query] || newsHandles.general;
  const results: SocialPost[] = [];

  const fetches = handles.slice(0, 3).map(async (handle) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://www.threads.net/@${handle}`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "text/html",
          },
        }
      );
      clearTimeout(timeout);
      if (!res.ok) return [];

      const html = await res.text();

      // Extract og:description which contains recent post text
      const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

      if (descMatch?.[1]) {
        return [{
          title: String(titleMatch?.[1] || handle).slice(0, 120),
          text: String(descMatch[1]).slice(0, 300),
          url: `https://www.threads.net/@${handle}`,
          image: imgMatch?.[1] || null,
          author: `@${handle}`,
          platform: "threads" as const,
          score: 0,
          timestamp: new Date().toISOString(),
          comments: 0,
        }];
      }
      return [];
    } catch {
      return [];
    }
  });

  const settled = await Promise.allSettled(fetches);
  for (const r of settled) {
    if (r.status === "fulfilled") results.push(...r.value);
  }

  return results.slice(0, limit);
}

// ── X/Twitter via Nitter RSS (Source 7) ──

/*
  Nitter is an open-source Twitter frontend that exposes RSS feeds.
  Public instances rotate — we use a fallback chain for reliability.
  If all Nitter instances fail, returns empty (graceful degradation).
*/

const NITTER_INSTANCES = [
  "nitter.privacydev.net",
  "nitter.poast.org",
  "nitter.1d4.us",
  "nitter.kavin.rocks",
];

const X_TRENDING_ACCOUNTS: Record<string, string[]> = {
  in: ["ndtv", "TimesNow", "republic", "PTI_News", "ANI", "the_hindu"],
  us: ["AP", "Reuters", "nytimes", "CNN", "washingtonpost", "BBCBreaking"],
  gb: ["BBCBreaking", "SkyNews", "guardian", "Telegraph", "iabortnews"],
  general: ["Reuters", "AP", "BBCBreaking", "AFP", "AJEnglish"],
  sports: ["ESPNcricinfo", "SkySports", "espn", "NBA", "FIFAcom"],
  tech: ["TechCrunch", "verge", "WIRED", "mashable", "engadget"],
  entertainment: ["variety", "THR", "ETimes", "FilmCompanion"],
};

function getXAccounts(country: string, category: string): string[] {
  if (category !== "general" && X_TRENDING_ACCOUNTS[category]) {
    return X_TRENDING_ACCOUNTS[category];
  }
  return X_TRENDING_ACCOUNTS[country] || X_TRENDING_ACCOUNTS.general;
}

export async function fetchXTrending(
  country: string,
  category: string,
  limit: number = 6
): Promise<SocialPost[]> {
  const accounts = getXAccounts(country, category);
  const results: SocialPost[] = [];

  // Try Nitter instances in order until one works
  for (const instance of NITTER_INSTANCES) {
    if (results.length >= limit) break;

    const fetches = accounts.slice(0, 4).map(async (account) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
          `https://${instance}/${account}/rss`,
          {
            signal: controller.signal,
            headers: { "User-Agent": "NewsLens/1.0" },
          }
        );
        clearTimeout(timeout);
        if (!res.ok) return [];

        const xml = await res.text();

        // Parse RSS items
        const items: SocialPost[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < 3) {
          const item = match[1];
          const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
            || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
          const desc = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || "";

          // Extract image from description HTML
          const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);

          items.push({
            title: title.replace(/<[^>]+>/g, "").slice(0, 140),
            text: desc.replace(/<[^>]+>/g, "").slice(0, 280),
            url: link.replace(instance, "x.com"),
            image: imgMatch?.[1] || null,
            author: `@${account}`,
            platform: "x" as const,
            score: 0, // Nitter RSS doesn't expose engagement counts
            timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            comments: 0,
          });
        }
        return items;
      } catch {
        return [];
      }
    });

    const settled = await Promise.allSettled(fetches);
    for (const r of settled) {
      if (r.status === "fulfilled") results.push(...r.value);
    }

    // If this instance returned data, stop trying others
    if (results.length > 0) break;
  }

  // Sort by recency (Nitter doesn't give engagement data)
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return results.slice(0, limit);
}

// ── Threads search queries by region ──

const THREADS_QUERIES: Record<string, string> = {
  in: "india",
  us: "general",
  gb: "general",
  tech: "tech",
  sports: "india", // Threads is big in India for sports
  entertainment: "india",
};

function getThreadsQuery(country: string, category: string): string {
  if (category !== "general" && THREADS_QUERIES[category]) return THREADS_QUERIES[category];
  return THREADS_QUERIES[country] || "general";
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
  const threadsQuery = getThreadsQuery(country, category);

  const [reddit, bluesky, youtube, wikipedia, hackernews, threads, xTwitter] = await Promise.allSettled([
    fetchRedditTrending(country, lang, category, 8),
    fetchBlueskyTrending(bskyQuery, 6),
    fetchYouTubeTrending(country),
    fetchWikipediaTrending(lang),
    fetchHackerNews(category, 6),
    fetchThreadsTrending(threadsQuery, 4),
    fetchXTrending(country, category, 4),
  ]);

  const posts: SocialPost[] = [];
  const platforms: string[] = [];

  const redditPosts = reddit.status === "fulfilled" ? reddit.value : [];
  const bskyPosts = bluesky.status === "fulfilled" ? bluesky.value : [];
  const ytPosts = youtube.status === "fulfilled" ? youtube.value : [];
  const wikiPosts = wikipedia.status === "fulfilled" ? wikipedia.value : [];
  const hnPosts = hackernews.status === "fulfilled" ? hackernews.value : [];
  const threadsPosts = threads.status === "fulfilled" ? threads.value : [];
  const xPosts = xTwitter.status === "fulfilled" ? xTwitter.value : [];

  if (redditPosts.length > 0) platforms.push("Reddit");
  if (bskyPosts.length > 0) platforms.push("Bluesky");
  if (ytPosts.length > 0) platforms.push("YouTube");
  if (wikiPosts.length > 0) platforms.push("Wikipedia");
  if (hnPosts.length > 0) platforms.push("Hacker News");
  if (threadsPosts.length > 0) platforms.push("Threads");
  if (xPosts.length > 0) platforms.push("X");

  // Sort each by score, then interleave: X and Reddit first (real-time pulse), then others
  redditPosts.sort((a, b) => b.score - a.score);
  hnPosts.sort((a, b) => b.score - a.score);
  const allSources = [xPosts, redditPosts, threadsPosts, hnPosts, bskyPosts, ytPosts, wikiPosts];
  const maxLen = Math.max(...allSources.map(s => s.length));
  for (let i = 0; i < maxLen; i++) {
    for (const source of allSources) {
      if (i < source.length) posts.push(source[i]);
    }
  }

  return { posts, platforms };
}
