/*
  Image enrichment pipeline for news articles.

  1. Detect duplicate/branding images across articles
  2. Scrape real og:image / twitter:image from article pages
  3. Bing Image Search fallback for articles still missing images

  Runs inside the cache layer so scraping only happens once per cache cycle.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

import { isSafeUrl } from "./ssrf";

// ── Known logo/icon/branding URL patterns ──
const LOGO_PATTERNS = [
  /logo/i, /favicon/i, /icon[-_.]?/i, /brand/i, /avatar/i,
  /default[-_]?image/i, /placeholder/i, /no[-_]?image/i,
  /sprite/i, /widget/i, /badge/i,
  /1x1/i, /pixel/i, /spacer/i,
];

function isLikelyLogoUrl(url: string): boolean {
  if (LOGO_PATTERNS.some((p) => p.test(url))) return true;
  if (/OG[-_]?section|thehindu\.com\/theme|indiatoday\.in\/assets/i.test(url)) return true;
  return false;
}

function isRealArticleImage(imgUrl: string): boolean {
  if (!imgUrl) return false;
  if (isLikelyLogoUrl(imgUrl)) return false;
  try {
    const u = new URL(imgUrl.startsWith("//") ? "https:" + imgUrl : imgUrl);
    const pathParts = u.pathname.split("/").filter(Boolean);
    if (pathParts.length <= 2) {
      const filename = pathParts[pathParts.length - 1] || "";
      if (/^(default|og|OG|share|social|thumb|cover|banner|section|generic|placeholder|common)/i.test(filename)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

// ── Scrape og:image / twitter:image from article HTML ──
async function scrapeArticleImage(url: string): Promise<string | null> {
  if (!isSafeUrl(url)) return null;
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
    while (html.length < 30000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const ogMatch = html.match(/<meta[^>]*property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/i);
    const ogUrl = ogMatch?.[1];

    const twMatch = html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i);
    const twUrl = twMatch?.[1];

    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)];
    const candidateImgs = imgMatches
      .map((m) => {
        const src = m[1];
        const full = m[0];
        const wMatch = full.match(/width=["']?(\d+)/i);
        const hMatch = full.match(/height=["']?(\d+)/i);
        return { src, w: wMatch ? parseInt(wMatch[1]) : 0, h: hMatch ? parseInt(hMatch[1]) : 0 };
      })
      .filter((img) => {
        if (!img.src || img.src.startsWith("data:")) return false;
        if (isLikelyLogoUrl(img.src)) return false;
        if (img.w > 0 && img.w < 300) return false;
        if (img.h > 0 && img.h < 200) return false;
        return true;
      })
      .sort((a, b) => (b.w * b.h) - (a.w * a.h));

    if (ogUrl && isRealArticleImage(ogUrl)) return ogUrl;
    if (twUrl && isRealArticleImage(twUrl)) return twUrl;
    if (candidateImgs.length > 0) return candidateImgs[0].src;
    return null;
  } catch {
    return null;
  }
}

// ── Bing Image Search fallback ──
export async function searchImageForHeadline(query: string): Promise<string | null> {
  try {
    const searchQuery = encodeURIComponent(query.slice(0, 100) + " news");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

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

    // Read up to 100KB — Bing embeds image URLs early in the page
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 100_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel();

    const murlMatches = [...html.matchAll(/murl[&quot;]*[=:][&quot;]*["']?(https?:\/\/[^"'&]+\.(?:jpg|jpeg|png|webp)[^"'&]*)/gi)];
    for (const m of murlMatches) {
      const url = decodeURIComponent(m[1]);
      if (/logo|icon|favicon|avatar|badge|pixel|1x1|spacer/i.test(url)) continue;
      return url;
    }

    const imgTagMatches = [...html.matchAll(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)];
    for (const m of imgTagMatches) {
      const url = m[1];
      if (/bing\.com|microsoft\.com|logo|icon|favicon|avatar|badge/i.test(url)) continue;
      if (url.includes("th?id=")) continue;
      return url;
    }

    const tbnMatches = [...html.matchAll(/src=["'](https?:\/\/tse\d+\.mm\.bing\.net\/th\?[^"']+)["']/gi)];
    if (tbnMatches.length > 0) return tbnMatches[0][1];

    return null;
  } catch {
    return null;
  }
}

// ── Concurrency limiter ──
function pLimit(concurrency: number) {
  const queue: (() => void)[] = [];
  let active = 0;

  function next() {
    if (queue.length > 0 && active < concurrency) {
      active++;
      const run = queue.shift()!;
      run();
    }
  }

  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => {
          active--;
          next();
        });
      });
      next();
    });
  };
}

// ── Main enrichment pipeline ──
export async function enrichArticleImages(articles: any[]): Promise<any[]> {
  // STEP 1: Detect duplicate images (site-wide logos)
  const imageCounts = new Map<string, number>();
  for (const a of articles) {
    if (a.image) {
      const normalized = a.image.split("?")[0];
      imageCounts.set(normalized, (imageCounts.get(normalized) || 0) + 1);
    }
  }
  const duplicateImages = new Set<string>();
  for (const [img, count] of imageCounts) {
    if (count >= 2) duplicateImages.add(img);
  }

  // STEP 2: Mark articles needing real images
  const needsImage: number[] = [];
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    if (!a.image) { needsImage.push(i); continue; }
    if (isLikelyLogoUrl(a.image)) { needsImage.push(i); continue; }
    const normalized = a.image.split("?")[0];
    if (duplicateImages.has(normalized)) { needsImage.push(i); continue; }
  }

  if (needsImage.length === 0) return articles;

  // STEP 3: Scrape real images (max 5 concurrent)
  const limit = pLimit(5);
  const results = await Promise.allSettled(
    needsImage.map((idx) => limit(() => scrapeArticleImage(articles[idx].url)))
  );

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

  // STEP 4: Bing Image Search fallback (max 3 concurrent)
  if (stillNeedsImage.length > 0) {
    const bingLimit = pLimit(3);
    const bingResults = await Promise.allSettled(
      stillNeedsImage.map((idx) => bingLimit(() => searchImageForHeadline(articles[idx].title)))
    );
    for (let k = 0; k < stillNeedsImage.length; k++) {
      const r = bingResults[k];
      if (r.status === "fulfilled" && r.value) {
        articles[stillNeedsImage[k]].image = r.value;
      }
    }
  }

  return articles;
}
