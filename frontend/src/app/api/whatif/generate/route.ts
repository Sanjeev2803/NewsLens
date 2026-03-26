import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  POST /api/whatif/generate — AI-generate article body for Creator Hub.
  Uses Gemini 2.5 Flash to write an analysis based on title, hook, and tone.
  Requires authentication. Rate limited.
*/

const TONE_PROMPTS: Record<string, string> = {
  fanboy: "Write like an excited superfan who LOVES this topic. High energy, passionate, use strong opinions and bold claims. Think sports commentator meets tech blogger. Hype it up.",
  analytical: "Write like a senior analyst at a think tank. Data-driven, measured, cite potential statistics. Use frameworks and structured reasoning. Professional but accessible.",
  dramatic: "Write like a thriller novelist narrating breaking news. Build tension, use cliffhangers between sections, paint vivid scenarios. Make the reader feel the stakes.",
  satirical: "Write like a sharp satirist — think The Onion meets serious commentary. Use irony, wit, and pointed humor to make the audience think while laughing.",
  personified: "Write in first person as if YOU are the trend/topic itself. 'I am the rising fuel price, and here is what I plan to do next.' Creative, immersive, unexpected perspective.",
  neutral: "Write in a balanced, journalistic tone. Present multiple perspectives fairly. No strong opinions — let the reader decide. Clear, concise, factual framing.",
};

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { title?: string; description?: string; tone?: string; customTone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  const tone = (body.tone || "analytical").toLowerCase();
  const customTone = (body.customTone || "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI generation unavailable" }, { status: 503 });
  }

  const toneInstruction = tone === "custom" && customTone
    ? customTone
    : TONE_PROMPTS[tone] || TONE_PROMPTS.analytical;

  const systemPrompt = `You are a brilliant writer for NewsLens, a news analysis platform for 18-24 year olds in India and globally.

TONE: ${toneInstruction}

RULES:
- Write 400-800 words
- Use markdown: ## for section headings, **bold** for emphasis, - for bullet points
- Address the reader as "you"
- No emojis ever
- Include specific numbers, names, dates where possible — don't be vague
- Make bold predictions — this is a "What If" scenario, not a Wikipedia article
- Reference real companies, people, policies when relevant
- End with a thought-provoking question or call to action
- Write in a way that makes people want to share this on Instagram/Twitter`;

  const userPrompt = `Write a What-If analysis article.

Title: ${title}
${description ? `Hook: ${description}` : ""}

Write the full article body. Make it compelling, specific, and shareable.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[generate] Gemini error:", res.status, errData);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 502 });
    }

    return NextResponse.json({ body: text });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "AI generation timed out" }, { status: 504 });
    }
    console.error("[generate] error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
