import { NextRequest, NextResponse } from "next/server";

// GET /api/translate?text=<encoded>&to=hi&from=auto
// Free translation using Google gtx endpoint (no API key) with MyMemory fallback
export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const to = req.nextUrl.searchParams.get("to") || "hi";
  const from = req.nextUrl.searchParams.get("from") || "auto";

  if (!text) return NextResponse.json({ error: "text parameter required" }, { status: 400 });

  // Limit to 5000 chars
  const input = text.slice(0, 5000);

  // Try Google gtx (unofficial but reliable, no key needed)
  const googleResult = await translateWithGoogle(input, from, to);
  if (googleResult) {
    return NextResponse.json({ translatedText: googleResult, provider: "google", error: null });
  }

  // Fallback: MyMemory (500 char chunks)
  const myMemoryResult = await translateWithMyMemory(input, from === "auto" ? "en" : from, to);
  if (myMemoryResult) {
    return NextResponse.json({ translatedText: myMemoryResult, provider: "mymemory", error: null });
  }

  return NextResponse.json({ translatedText: null, provider: null, error: "All translation services failed" });
}

async function translateWithGoogle(text: string, from: string, to: string): Promise<string | null> {
  try {
    // Split into chunks of ~4000 chars at sentence boundaries
    const chunks = splitIntoChunks(text, 4000);
    const results: string[] = [];

    for (const chunk of chunks) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(chunk)}`,
        {
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0" },
        }
      );
      clearTimeout(timeout);
      if (!res.ok) return null;

      const data = await res.json();
      // Response format: [[["translated text","original text",null,null,N],...],null,"en"]
      const translated = (data[0] || [])
        .map((segment: [string]) => segment[0])
        .join("");
      results.push(translated);
    }

    return results.join(" ");
  } catch {
    return null;
  }
}

async function translateWithMyMemory(text: string, from: string, to: string): Promise<string | null> {
  try {
    const chunks = splitIntoChunks(text, 450);
    const results: string[] = [];

    for (const chunk of chunks) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) continue;

      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated) results.push(translated);
    }

    return results.length > 0 ? results.join(" ") : null;
  } catch {
    return null;
  }
}

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last sentence boundary within maxLen
    let splitAt = remaining.lastIndexOf(". ", maxLen);
    if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf(" ", maxLen);
    if (splitAt < maxLen * 0.3) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt + 1));
    remaining = remaining.slice(splitAt + 1);
  }
  return chunks;
}
