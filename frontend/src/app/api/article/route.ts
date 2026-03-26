import { NextRequest, NextResponse } from "next/server";
import { isSafeUrl } from "@/lib/ssrf";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

// GET /api/article?url=<encoded-url>
// Extracts main article text from a news page
export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
    );
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url parameter required" }, { status: 400 });

  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return NextResponse.json({ error: `Fetch failed: ${res.status}`, content: null });

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<title>([^<]+)<\/title>/i);
    const title = decodeEntities(titleMatch?.[1] || "");

    // Extract image
    const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const image = imgMatch?.[1] || null;

    // Extract published date
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
    const publishedAt = dateMatch?.[1] || null;

    // Extract article body — try multiple strategies
    let content = "";

    // Strategy 1: <article> tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) content = extractText(articleMatch[1]);

    // Strategy 2: Common article body class names
    if (!content || content.length < 200) {
      const bodyPatterns = [
        /class=["'][^"']*(?:article[-_]?body|story[-_]?body|post[-_]?content|entry[-_]?content|article__body|td-post-content|content[-_]?body|story_body|article-text|main-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
        /itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/gi,
      ];
      for (const pattern of bodyPatterns) {
        const matches = [...html.matchAll(pattern)];
        for (const m of matches) {
          const extracted = extractText(m[1]);
          if (extracted.length > content.length) content = extracted;
        }
      }
    }

    // Strategy 3: Collect all <p> tags from the page
    if (!content || content.length < 200) {
      const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(m => stripTags(m[1]).trim())
        .filter(p => p.length > 40); // Only meaningful paragraphs
      if (paragraphs.length > 0) content = paragraphs.join("\n\n");
    }

    // Clean up
    content = content
      .replace(/\s*\n\s*\n\s*\n+/g, "\n\n") // collapse multiple newlines
      .trim();

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      title,
      content: content || null,
      image,
      publishedAt,
      wordCount,
      error: content ? null : "Could not extract article content",
    });
  } catch (err) {
    return NextResponse.json({
      error: `Extraction failed: ${String(err)}`,
      content: null,
      title: null,
      image: null,
      publishedAt: null,
      wordCount: 0,
    });
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function extractText(html: string): string {
  // Remove scripts, styles, nav, footer, aside
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "");

  // Extract paragraphs
  const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => stripTags(m[1]).trim())
    .filter(p => p.length > 30);

  if (paragraphs.length > 0) return paragraphs.join("\n\n");

  // Fallback: strip all tags
  return stripTags(cleaned).trim();
}
