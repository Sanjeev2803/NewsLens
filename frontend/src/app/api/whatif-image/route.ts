import { NextRequest } from "next/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  AI cartoon image proxy — dual provider with fallback.
  Rate limited, size-capped, API keys server-side.
*/

async function tryPollinations(prompt: string, seed: string, width: number, height: number): Promise<Response | null> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&safe=true`;
    const res = await fetch(url, { signal: controller.signal, headers: { "Authorization": `Bearer ${apiKey}` } });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Image-Provider": "pollinations",
      },
    });
  } catch {
    return null;
  }
}

async function tryGemini(prompt: string): Promise<Response | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        signal: controller.signal,
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const imgPart = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    );
    if (!imgPart?.inlineData?.data) return null;

    const buf = Buffer.from(imgPart.inlineData.data, "base64");
    return new Response(buf, {
      headers: {
        "Content-Type": imgPart.inlineData.mimeType || "image/png",
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Image-Provider": "gemini",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Rate limit — prevent API credit burn
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return new Response("Rate limited", { status: 429 });
  }

  const prompt = req.nextUrl.searchParams.get("prompt");
  const seed = req.nextUrl.searchParams.get("seed") || "0";
  // Cap dimensions to prevent memory bombs
  const w = Math.min(1200, Math.max(100, parseInt(req.nextUrl.searchParams.get("w") || "800", 10) || 800));
  const h = Math.min(800, Math.max(100, parseInt(req.nextUrl.searchParams.get("h") || "500", 10) || 500));

  if (!prompt || prompt.length > 500) {
    return new Response("Invalid prompt", { status: 400 });
  }

  // Try Pollinations first (faster), then Gemini (higher quality)
  const result = await tryPollinations(prompt, seed, w, h) || await tryGemini(prompt);

  if (result) return result;

  return new Response("All image providers unavailable", { status: 503 });
}
