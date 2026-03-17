import type { Article } from "@/types/news";

/* ══════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════ */
export const COUNTRIES = [
  { code: "in", label: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "us", label: "USA", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "gb", label: "UK", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "jp", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "au", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "ca", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "de", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "fr", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "br", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "cn", label: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "ru", label: "Russia", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "za", label: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
];

export const LANGUAGES = [
  { code: "en", label: "English", region: null },
  { code: "hi", label: "Hindi", region: "UP, MP, Delhi, Rajasthan" },
  { code: "ta", label: "Tamil", region: "Tamil Nadu" },
  { code: "te", label: "Telugu", region: "AP, Telangana" },
  { code: "mr", label: "Marathi", region: "Maharashtra" },
  { code: "bn", label: "Bengali", region: "West Bengal" },
  { code: "gu", label: "Gujarati", region: "Gujarat" },
  { code: "kn", label: "Kannada", region: "Karnataka" },
  { code: "ml", label: "Malayalam", region: "Kerala" },
  { code: "pa", label: "Punjabi", region: "Punjab" },
  { code: "ur", label: "Urdu", region: "J&K, Telangana" },
  { code: "fr", label: "French", region: null },
  { code: "de", label: "German", region: null },
  { code: "ja", label: "Japanese", region: null },
  { code: "zh", label: "Chinese", region: null },
  { code: "es", label: "Spanish", region: null },
  { code: "pt", label: "Portuguese", region: null },
  { code: "ar", label: "Arabic", region: null },
];

export const CATEGORIES = [
  { id: "general", label: "Top Stories" },
  { id: "nation", label: "Regional" },
  { id: "world", label: "World" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
];

export const TTS_LANG_MAP: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN",
  bn: "bn-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
  ur: "ur-PK", fr: "fr-FR", de: "de-DE", ja: "ja-JP", zh: "zh-CN",
  es: "es-ES", pt: "pt-BR", ar: "ar-SA",
};

export const NARUTO_INTROS: Record<string, string[]> = {
  en: ["Dattebayo! Listen up!", "Believe it! Here's the news!", "Hey hey! Check this out!"],
  hi: ["Dattebayo! Suno suno!", "Yosh! Yeh news sunlo!", "Oi oi! Yeh dekho!"],
  ta: ["Dattebayo! Kelunga!", "Yosh! Idha parunga!", "Oi oi! News vandhiruchu!"],
  te: ["Dattebayo! Vinandi!", "Yosh! Idi choodandi!", "Oi oi! News vachindi!"],
  mr: ["Dattebayo! Aika!", "Yosh! He bagha!", "Oi oi! News aali!"],
  bn: ["Dattebayo! Shono!", "Yosh! Eta dekho!", "Oi oi! News esheche!"],
  gu: ["Dattebayo! Sambhlo!", "Yosh! Aa jo news!", "Oi oi! Saro samachaar!"],
  kn: ["Dattebayo! Keli!", "Yosh! Idu nodi!", "Oi oi! News bandide!"],
  ml: ["Dattebayo! Kelkku!", "Yosh! Ithu nokkoo!", "Oi oi! News vannu!"],
  pa: ["Dattebayo! Suno ji!", "Yosh! Eh dekho!", "Oi oi! Khabar aayi!"],
  ur: ["Dattebayo! Suniye!", "Yosh! Yeh dekhiye!", "Oi oi! Khabar aayi!"],
  ja: ["\u3060\u3063\u3066\u3070\u3088\uff01\u805e\u3044\u3066\u304f\u308c\uff01", "\u3088\u3057\uff01\u30cb\u30e5\u30fc\u30b9\u3060\uff01", "\u304a\u3044\uff01\u3053\u308c\u3092\u898b\u308d\uff01"],
  fr: ["Dattebayo! \u00c9coutez!", "Yosh! Les nouvelles!", "Oi oi! Regardez \u00e7a!"],
  de: ["Dattebayo! H\u00f6rt zu!", "Yosh! Nachrichten!", "Oi oi! Schaut mal!"],
  zh: ["Dattebayo! \u542c\u597d\u4e86\uff01", "Yosh! \u65b0\u95fb\u6765\u4e86\uff01", "\u5582\u5582\uff01\u770b\u8fd9\u4e2a\uff01"],
  es: ["Dattebayo! Escuchen!", "Yosh! Noticias!", "Oi oi! Miren esto!"],
  pt: ["Dattebayo! Ou\u00e7am!", "Yosh! Not\u00edcias!", "Oi oi! Vejam isso!"],
  ar: ["Dattebayo! \u0627\u0633\u0645\u0639\u0648\u0627!", "Yosh! \u0623\u062e\u0628\u0627\u0631!", "\u0647\u064a\u064a! \u0634\u0648\u0641\u0648\u0627 \u0647\u0630\u0627!"],
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  general: "from-sharingan-red/20 via-[#1a0a0a] to-[#0a0a10]",
  nation: "from-amaterasu-purple/20 via-[#0e0a1a] to-[#0a0a10]",
  world: "from-rasengan-blue/20 via-[#0a0a1a] to-[#0a0a10]",
  sports: "from-sage-green/20 via-[#0a1a0a] to-[#0a0a10]",
  entertainment: "from-chakra-orange/20 via-[#1a0e0a] to-[#0a0a10]",
  technology: "from-cyan-500/20 via-[#0a1a1a] to-[#0a0a10]",
  business: "from-yellow-500/20 via-[#1a1a0a] to-[#0a0a10]",
  science: "from-emerald-500/20 via-[#0a1a10] to-[#0a0a10]",
  health: "from-pink-500/20 via-[#1a0a10] to-[#0a0a10]",
};

export const CATEGORY_ICONS: Record<string, string> = {
  general: "\u{1F5DE}", nation: "\u{1F3EF}", world: "\u{1F30D}", sports: "\u{26BD}",
  entertainment: "\u{1F3AC}", technology: "\u{1F4BB}", business: "\u{1F4C8}",
  science: "\u{1F52C}", health: "\u{1F3E5}",
};

export const NEWS_FALLBACK_IMAGES: Record<string, string> = {
  general: "https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=600&q=80",
  nation: "https://images.unsplash.com/photo-1524522173746-f628baad3644?w=600&q=80",
  world: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-bd45ba8bfbb0?w=600&q=80",
  entertainment: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  business: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
  science: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&q=80",
  health: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
};

export const PLAT: Record<string, { color: string; icon: string }> = {
  reddit: { color: "#FF4500", icon: "R" }, bluesky: { color: "#0085FF", icon: "B" },
  youtube: { color: "#FF0000", icon: "Y" }, wikipedia: { color: "#636466", icon: "W" },
};

/* ── Helper Functions ── */

export function getArticleRank(publishedAt: string): { label: string; sub: string; color: string; borderColor: string; bgColor: string; glow: string; icon: string } {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const hours = ageMs / (1000 * 60 * 60);

  if (hours < 1) return { label: "S-RANK", sub: "BREAKING", color: "#FF2222", borderColor: "border-red-500/50", bgColor: "bg-red-500/10", glow: "shadow-[0_0_16px_rgba(255,34,34,0.4)]", icon: "\u{1F525}" };
  if (hours < 3) return { label: "A-RANK", sub: "FRESH", color: "#FF8800", borderColor: "border-orange-500/40", bgColor: "bg-orange-500/10", glow: "shadow-[0_0_10px_rgba(255,136,0,0.25)]", icon: "\u{26A1}" };
  if (hours < 12) return { label: "B-RANK", sub: "RECENT", color: "#3388FF", borderColor: "border-blue-500/30", bgColor: "bg-blue-500/10", glow: "", icon: "\u{1F4DC}" };
  return { label: "C-RANK", sub: "FILED", color: "#666680", borderColor: "border-gray-600/20", bgColor: "bg-gray-600/10", glow: "", icon: "\u{1F4C4}" };
}

export function translateUrl(url: string, targetLang: string): string {
  return `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(url)}`;
}

/** Chakra freshness — 1.0 = just now, 0.0 = 24h+ old */
export function chakraLevel(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return Math.max(0, 1 - ageMs / (24 * 60 * 60 * 1000));
}

export function formatTimeSpecific(d: Date): string {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (isToday) return `Today ${time}`;
  if (isYesterday) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

export interface TimelineItem {
  type: "article" | "social";
  time: Date;
  data: Article | SocialPost;
}

import type { SocialPost } from "@/types/news";

export function groupByHour(items: TimelineItem[]): { label: string; items: TimelineItem[] }[] {
  const groups: Record<string, TimelineItem[]> = {};
  const order: string[] = [];

  for (const item of items) {
    const d = item.time;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const hourStr = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    let label: string;
    if (isToday) label = `Today, ${hourStr}`;
    else if (isYesterday) label = `Yesterday, ${hourStr}`;
    else label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${hourStr}`;

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(item);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}
