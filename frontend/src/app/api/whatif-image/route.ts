import { NextRequest } from "next/server";

/*
  Proxy for Pollinations AI cartoon images.
  Adds the API key server-side so it's never exposed to the browser.
  Caches aggressively — same prompt+seed always returns the same image.
*/

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get("prompt");
  const seed = req.nextUrl.searchParams.get("seed") || "0";

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    return new Response("Image generation not configured", { status: 503 });
  }

  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=800&height=500&seed=${seed}&model=flux-schnell&key=${apiKey}&nologo=true&safe=true`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response("Image generation failed", { status: 502 });
    }

    const imageBuffer = await res.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("Image generation timeout", { status: 504 });
  }
}
