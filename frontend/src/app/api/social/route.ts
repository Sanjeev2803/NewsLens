import { NextRequest, NextResponse } from "next/server";
import { fetchAllSocial } from "@/lib/socialSources";

// ── Bing Image Search fallback for social posts missing images ──
async function searchBingImage(query: string): Promise<string | null> {
  try {
    const searchQuery = encodeURIComponent(query.slice(0, 100));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://www.bing.com/images/search?q=${searchQuery}&form=HDRSC2&first=1`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();

    // Extract murl (media URL) from Bing results
    const murlMatches = [...html.matchAll(/murl[&quot;]*[=:][&quot;]*["']?(https?:\/\/[^"'&]+\.(?:jpg|jpeg|png|webp)[^"'&]*)/gi)];
    for (const m of murlMatches) {
      const url = decodeURIComponent(m[1]);
      if (/logo|icon|favicon|avatar|badge|pixel/i.test(url)) continue;
      return url;
    }
    // Bing thumbnails as fallback
    const tbnMatches = [...html.matchAll(/src=["'](https?:\/\/tse\d+\.mm\.bing\.net\/th\?[^"']+)["']/gi)];
    if (tbnMatches.length > 0) return tbnMatches[0][1];
    return null;
  } catch {
    return null;
  }
}

// GET /api/social?country=in&lang=ta&category=general
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country") || "in";
  const lang = searchParams.get("lang") || "en";
  const category = searchParams.get("category") || "general";

  try {
    const result = await fetchAllSocial(country, lang, category);

    // Enrich: fill missing images via Bing search
    const needsImage = result.posts
      .map((p, i) => (!p.image ? i : -1))
      .filter((i) => i >= 0);

    if (needsImage.length > 0) {
      const imgResults = await Promise.allSettled(
        needsImage.map((idx) => searchBingImage(result.posts[idx].title))
      );
      for (let j = 0; j < needsImage.length; j++) {
        const r = imgResults[j];
        if (r.status === "fulfilled" && r.value) {
          result.posts[needsImage[j]].image = r.value;
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch social data", details: String(err), posts: [], platforms: [] },
      { status: 500 }
    );
  }
}
