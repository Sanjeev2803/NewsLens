import { NextRequest } from "next/server";

/*
  AI cartoon image proxy — dual provider with fallback.
  1. Tries Pollinations (flux) first — fast, reliable
  2. Falls back to Gemini 2.5 Flash Image — higher quality
  API keys stay server-side. Caches aggressively.
*/

async function tryPollinations(prompt: string, seed: string, width: number, height: number): Promise<Response | null> {
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&key=${apiKey}&nologo=true&safe=true`;
    const res = await fetch(url, { signal: controller.signal });
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
  const prompt = req.nextUrl.searchParams.get("prompt");
  const seed = req.nextUrl.searchParams.get("seed") || "0";
  const w = parseInt(req.nextUrl.searchParams.get("w") || "800", 10);
  const h = parseInt(req.nextUrl.searchParams.get("h") || "500", 10);

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  // Try Pollinations first (faster), then Gemini (higher quality)
  const result = await tryPollinations(prompt, seed, w, h) || await tryGemini(prompt);

  if (result) return result;

  return new Response("All image providers unavailable", { status: 503 });
}
