import { NextRequest } from "next/server";

/*
  Proxy for Gemini 2.5 Flash Image generation.
  Generates cartoon illustrations on-demand, caches aggressively.
  API key stays server-side — never exposed to browser.
*/

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get("prompt");

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Image generation not configured", { status: 503 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response("Image generation failed", { status: 502 });
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) {
      return new Response("No image in response", { status: 502 });
    }

    const imgPart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );
    if (!imgPart?.inlineData?.data) {
      return new Response("No image data", { status: 502 });
    }

    const imageBuffer = Buffer.from(imgPart.inlineData.data, "base64");
    const mime = imgPart.inlineData.mimeType || "image/png";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("Image generation timeout", { status: 504 });
  }
}
