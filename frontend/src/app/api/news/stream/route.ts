import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/newsSources";
import { cachedFetch } from "@/lib/cache";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  SSE endpoint — streams news updates to the client.
  Replaces client-side polling with server-pushed events.

  GET /api/news/stream?category=general&country=in&lang=en

  Sends an event every 60s with fresh data, or immediately on connect.
  Client uses EventSource to receive updates. Max 10 minutes per connection.
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_STREAM_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
    );
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || "general";
  const country = searchParams.get("country") || "in";
  const lang = searchParams.get("lang") || "en";
  const max = Math.min(parseInt(searchParams.get("max") || "12", 10) || 12, 50);

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      }

      async function fetchAndSend() {
        if (closed) return;
        try {
          const cacheKey = `news:${category}:${country}:${lang}`;
          const result = await cachedFetch(
            cacheKey,
            () => fetchAllNews({ category, country, lang, max: 30 }),
            { ttlMs: 3 * 60 * 1000, staleGraceMs: 10 * 60 * 1000 }
          );
          send("news", {
            articles: (result.articles || []).slice(0, max),
            totalArticles: result.articles?.length || 0,
            freshCount: result.freshCount || 0,
            sources: result.sources || [],
          });
        } catch {
          send("error", { message: "Failed to fetch news" });
        }
      }

      // Send immediately on connect
      await fetchAndSend();

      // Then every 60 seconds
      const interval = setInterval(fetchAndSend, 60_000);

      // Max stream duration — close after 10 minutes, client will auto-reconnect
      const maxLifetime = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        send("reconnect", { reason: "max-lifetime" });
        try { controller.close(); } catch { /* already closed */ }
      }, MAX_STREAM_DURATION_MS);

      // Handle client disconnect via abort signal
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearTimeout(maxLifetime);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
