import { NextRequest, NextResponse } from "next/server";

// GET /api/trends/[slug]
// Returns articles, social posts, and related trends matching a trend keyword
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const keyword = decodeURIComponent(slug).toLowerCase();
  const origin = req.nextUrl.origin;

  function matches(text: string | null | undefined): boolean {
    if (!text) return false;
    return text.toLowerCase().includes(keyword);
  }

  try {
    // Fetch news, social, and trends in parallel
    const [newsRes, socialRes, trendsRes] = await Promise.all([
      fetch(`${origin}/api/news?category=general&country=in&lang=en&max=40`).catch(() => null),
      fetch(`${origin}/api/social?country=in&lang=en`).catch(() => null),
      fetch(`${origin}/api/trends?country=in&lang=en`).catch(() => null),
    ]);

    // Parse articles
    let articles: unknown[] = [];
    if (newsRes && newsRes.ok) {
      const data = await newsRes.json();
      const all = data.articles || [];
      articles = all.filter(
        (a: { title?: string; description?: string }) =>
          matches(a.title) || matches(a.description)
      );
    }

    // Parse social posts
    let socialPosts: unknown[] = [];
    if (socialRes && socialRes.ok) {
      const data = await socialRes.json();
      const all = data.posts || [];
      socialPosts = all.filter(
        (p: { title?: string; text?: string }) =>
          matches(p.title) || matches(p.text)
      );
    }

    // Parse related trends (exclude current)
    let relatedTrends: unknown[] = [];
    if (trendsRes && trendsRes.ok) {
      const data = await trendsRes.json();
      const all = data.trends || [];
      relatedTrends = all
        .filter((t: { title?: string }) => t.title?.toLowerCase() !== keyword)
        .slice(0, 8);
    }

    return NextResponse.json({
      trend: { title: decodeURIComponent(slug), traffic: "" },
      articles,
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
