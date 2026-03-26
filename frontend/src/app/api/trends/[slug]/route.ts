import { NextRequest, NextResponse } from "next/server";
import { xmlParser } from "@/lib/newsSources";
import { fetchGoogleTrends } from "@/lib/regionalSources";

// GET /api/trends/[slug]
// Fetches news articles about a specific trend via Google News search RSS,
// plus social posts and related trends
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const keyword = decodeURIComponent(slug);
  const keywordLower = keyword.toLowerCase();
  const origin = req.nextUrl.origin;

  try {
    // Fetch news about this trend directly from Google News search RSS,
    // plus social posts and related trends — all in parallel
    const [googleArticles, socialRes, trends] = await Promise.all([
      fetchGoogleNewsSearch(keyword),
      fetch(`${origin}/api/social?country=in&lang=en`).catch(() => null),
      fetchGoogleTrends("IN").catch(() => []),
    ]);

    // Filter social posts by keyword match (word-level)
    let socialPosts: unknown[] = [];
    if (socialRes && socialRes.ok) {
      const data = await socialRes.json();
      const all = data.posts || [];
      const words = keywordLower.split(/\s+/).filter((w) => w.length > 2);
      socialPosts = all.filter(
        (p: { title?: string; text?: string }) => {
          const combined = `${p.title || ""} ${p.text || ""}`.toLowerCase();
          return words.some((w) => combined.includes(w));
        }
      );
    }

    // Find traffic info for this trend + related trends
    const currentTrend = trends.find(
      (t) => t.title.toLowerCase() === keywordLower
    );
    const relatedTrends = trends
      .filter((t) => t.title.toLowerCase() !== keywordLower)
      .slice(0, 8);

    return NextResponse.json({
      trend: { title: keyword, traffic: currentTrend?.traffic || "" },
      articles: googleArticles,
      socialPosts,
      relatedTrends,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch trend data", details: String(err) },
      { status: 500 }
    );
  }
}

// Search Google News RSS for articles about a specific query
async function fetchGoogleNewsSearch(
  query: string,
  max = 20
): Promise<
  {
    title: string;
    description: string;
    url: string;
    image: string | null;
    publishedAt: string;
    source: { name: string; url: string };
  }[]
> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=IN&ceid=IN:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsLens/1.0)" },
    next: { revalidate: 120 },
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const items = parsed?.rss?.channel?.item || [];
  const arr = Array.isArray(items) ? items : [items];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return arr.slice(0, max).map((item: Record<string, any>) => {
    const sourceName =
      typeof item.source === "object"
        ? item.source["#text"] || "Google News"
        : String(item.source || "Google News");
    const sourceUrl =
      typeof item.source === "object" ? item.source["@_url"] || "" : "";

    // Extract image from description HTML or media tags
    let image: string | null = null;
    const descHtml = String(item.description || "");
    const imgMatch = descHtml.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) image = imgMatch[1];
    if (!image && item["media:content"]?.["@_url"]) {
      image = item["media:content"]["@_url"];
    }

    return {
      title: String(item.title || "").replace(/ - .*$/, ""),
      description: descHtml
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .slice(0, 300),
      url: item.link || "",
      image,
      publishedAt: item.pubDate || new Date().toISOString(),
      source: { name: sourceName, url: sourceUrl },
    };
  });
}
