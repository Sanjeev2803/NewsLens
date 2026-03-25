/*
  Gemini API client for What-If article generation.

  Exports:
  - buildSystemPrompt(theory, mood, country) — constructs the Gemini system instruction
  - buildUserPrompt(trend, category, country) — constructs the per-trend user message
  - callGemini(systemPrompt, userPrompt) — calls gemini-2.5-flash, returns markdown or null
  - generateArticleWithGemini(theory, mood, trend, category, country) — main orchestrator
*/

import type { Theory, Mood, TrendInput } from "./types";

// ── Country context map ──────────────────────────────────────────────────────

const COUNTRY_CONTEXT: Record<string, { currency: string; dailyLife: string; culturalRef: string }> = {
  in: {
    currency: "INR (rupees)",
    dailyLife: "EMI payments, salary credits, grocery bills at Dmart, auto-rickshaw fares, UPSC prep, job market pressure",
    culturalRef: "Zomato orders, IPL scores, WhatsApp forwards, Sunday family lunches, board exam stress",
  },
  us: {
    currency: "USD (dollars)",
    dailyLife: "student loan payments, rent in major cities, gas prices, 401k balances, health insurance premiums",
    culturalRef: "Starbucks runs, Netflix bills, Black Friday shopping, Super Bowl weekend, college tuition",
  },
  gb: {
    currency: "GBP (pounds)",
    dailyLife: "council tax, mortgage payments, NHS wait times, train fares, energy bills",
    culturalRef: "pub visits, Premier League matchdays, holiday deals to Spain, Greggs sausage rolls",
  },
  de: {
    currency: "EUR (euros)",
    dailyLife: "rent in Berlin or Munich, DB train delays, Kurzarbeit, grocery costs at Aldi or Lidl",
    culturalRef: "Bundesliga weekends, Karneval, Autobahn drives, Spargel season",
  },
  fr: {
    currency: "EUR (euros)",
    dailyLife: "SNCF strikes, loyer (rent), baguette prices, 35-hour work week, healthcare co-pays",
    culturalRef: "Bastille Day, Tour de France, café terraces, vacances en août",
  },
  jp: {
    currency: "JPY (yen)",
    dailyLife: "conbini meals, train commutes, rent in Tokyo, overtime culture, pension contributions",
    culturalRef: "hanami picnics, summer festivals, capsule hotels, shinkansen travel",
  },
  au: {
    currency: "AUD (dollars)",
    dailyLife: "housing affordability crisis, café flat whites, HECS debt, superannuation, petrol prices",
    culturalRef: "BBQ weekends, AFL Grand Final, beach culture, Bunnings sausage sizzle",
  },
  br: {
    currency: "BRL (reais)",
    dailyLife: "PIX payments, Bolsa Família, fuel costs, FGTS, grocery bills at Pão de Açúcar",
    culturalRef: "Carnaval, football on the weekends, churrasco Sundays, baile funk",
  },
  ca: {
    currency: "CAD (dollars)",
    dailyLife: "housing costs in Toronto or Vancouver, Tim Hortons runs, RRSP contributions, gas prices",
    culturalRef: "Hockey Night in Canada, cottage weekends, maple syrup season, poutine",
  },
};

const DEFAULT_COUNTRY_CONTEXT = {
  currency: "local currency",
  dailyLife: "everyday expenses, rent, groceries, transport, job market",
  culturalRef: "local culture, media, sports, food",
};

function getCountryContext(country: string) {
  return COUNTRY_CONTEXT[country.toLowerCase()] ?? DEFAULT_COUNTRY_CONTEXT;
}

// ── System prompt builder ────────────────────────────────────────────────────

export function buildSystemPrompt(theory: Theory, mood: Mood, country: string): string {
  const ctx = getCountryContext(country);

  // sectionNames is added by a parallel agent — fall back gracefully if not yet present
  const sectionNames: string[] = (theory as Theory & { sectionNames?: string[] }).sectionNames ?? [];
  const sectionOutline =
    sectionNames.length > 0
      ? sectionNames.map((name, i) => `  ${i + 1}. ${name}`).join("\n")
      : "  Follow the theory's natural narrative arc.";

  return `You are a What-If article writer with a very specific voice and structure. Your job is to make news feel personal, urgent, and real for the reader.

## YOUR THEORY LENS: ${theory.name}
- Voice: ${theory.voice}
- Rhythm: ${theory.rhythm}
- Reader relationship: ${theory.readerRelationship}

## YOUR MOOD: ${mood.name}
- Feel: ${mood.feel}
- Word temperature: ${mood.wordTemperature.join(", ")}
- Sentence rhythm: ${mood.sentenceRhythm}
- Opening energy: ${mood.openingEnergy}
- Punctuation style: ${mood.punctuationStyle}
- Reader exit state: ${mood.readerExitState}

## ARTICLE STRUCTURE
Use these section names as your ## headings:
${sectionOutline}

## BASE RULES — follow these exactly or the article fails

**Voice and perspective**
- Write as if the READER is living this. "You" focused. Second person throughout.
- Be a smart friend explaining this over coffee — not a news anchor reading a teleprompter.
- 18-24 audience. They're smart, broke, online, and tired of being talked down to.
- No emojis. No icons. Words do all the work.

**Make it personal and specific**
- Hit pain points from THEIR life — EMI, salary, grocery bill, rent, job market, career anxiety.
- Country context: ${country.toUpperCase()}. Currency: ${ctx.currency}. Daily life references: ${ctx.dailyLife}.
- Cultural touchstones to draw from: ${ctx.culturalRef}.
- Specific math > vague claims. "847 months of your salary" beats "very expensive". Use real numbers.

**Structure and hooks**
- Open with a scroll-stopping hook — Twitter energy, brain-breaking first line. No warm-up, no "In recent years...".
- Then go deep — podcast depth, not tweet depth. Earn the reader's time.
- Humor comes from struggle recognition, not bolted-on jokes. If the mood calls for it, it should sting and make them laugh at the same time.

**Format**
- Markdown output: ## for section headings, **bold** for key phrases, - for lists when needed.
- 600-1000 words total. Not a word more.
- Do NOT use emojis, icons, or decorative punctuation outside of what the mood calls for.`;
}

// ── User prompt builder ──────────────────────────────────────────────────────

export function buildUserPrompt(trend: TrendInput, category: string, country: string): string {
  const relatedQueriesText =
    trend.relatedQueries.length > 0
      ? trend.relatedQueries.join(", ")
      : "none";

  return `Write a What-If article about this trending topic.

**Trend:** ${trend.title}
**Search traffic:** ${trend.traffic} searches
**Related queries people are searching:** ${relatedQueriesText}
**Category:** ${category}
**Country / region:** ${country.toUpperCase()}

Make your predictions bold and specific. Don't hedge into vagueness — commit to a scenario and take the reader through it. Make it personal to someone living in ${country.toUpperCase()}. Show them how this trend lands in their actual life, not in some abstract news-world.

Start with the hook. Don't introduce yourself. Don't summarize what happened. Open in the middle of the action.`;
}

// ── Gemini API call ──────────────────────────────────────────────────────────

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 15_000;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY is not set");
    return null;
  }

  const url = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2048,
    },
  };

  async function attemptCall(): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — do NOT retry
        console.warn("[gemini] Rate limited (429). Not retrying.");
        return null;
      }

      if (!res.ok) {
        // 5xx or other — signal for retry
        throw new Error(`HTTP ${res.status}`);
      }

      const data: GeminiResponse = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

      if (!text) {
        console.error("[gemini] Empty response from API");
        return null;
      }

      return text.trim();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // First attempt
  try {
    return await attemptCall();
  } catch (firstErr) {
    const isNetworkOrServer =
      firstErr instanceof Error &&
      (firstErr.name === "AbortError" ||
        firstErr.message.startsWith("HTTP 5") ||
        firstErr.message.includes("fetch") ||
        firstErr.message.includes("network"));

    if (!isNetworkOrServer) {
      console.error("[gemini] Non-retryable error:", firstErr);
      return null;
    }

    // Single retry for 5xx / network errors
    console.warn("[gemini] First attempt failed, retrying once:", firstErr);
    try {
      return await attemptCall();
    } catch (retryErr) {
      console.error("[gemini] Retry also failed:", retryErr);
      return null;
    }
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateArticleWithGemini(
  theory: Theory,
  mood: Mood,
  trend: TrendInput,
  category: string,
  country: string
): Promise<string | null> {
  const systemPrompt = buildSystemPrompt(theory, mood, country);
  const userPrompt = buildUserPrompt(trend, category, country);
  return callGemini(systemPrompt, userPrompt);
}
