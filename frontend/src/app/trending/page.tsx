"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/* ══════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════ */
interface Article {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}
interface TrendingTopic { title: string; traffic: string; relatedQueries: string[]; url: string; }
interface SocialPost { title: string; text: string; url: string; image: string | null; author: string; platform: "reddit" | "bluesky" | "youtube" | "wikipedia"; score: number; timestamp: string; comments?: number; }
interface ApiResponse { articles: Article[]; totalArticles: number; freshCount: number; sources?: string[]; trending?: TrendingTopic[]; region?: string | null; error?: string; }
interface SocialResponse { posts: SocialPost[]; platforms: string[]; }

/* ══════════════════════════════════════════════
   SHARINGAN SVG — The Iconic Eye
   ══════════════════════════════════════════════ */
function SharinganEye({ size = 24, spin = false, className = "", glow = false }: { size?: number; spin?: boolean; className?: string; glow?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${className} ${glow ? "drop-shadow-[0_0_12px_rgba(204,0,0,0.6)]" : ""}`}
      animate={spin ? { rotate: 360 } : {}}
      transition={spin ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
    >
      <circle cx="50" cy="50" r="48" fill="#1a0000" stroke="#330000" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" fill="#0d0000" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#660000" strokeWidth="1.5" />
      {/* Inner ring */}
      <circle cx="50" cy="50" r="28" fill="none" stroke="#880000" strokeWidth="0.8" opacity="0.5" />
      {/* Pupil */}
      <circle cx="50" cy="50" r="9" fill="#000" />
      <circle cx="50" cy="50" r="7" fill="#050505" />
      {/* Red iris glow */}
      <circle cx="50" cy="50" r="25" fill="none" stroke="#CC0000" strokeWidth="0.5" opacity="0.6" />
      {/* 3 Tomoe with tails */}
      {[0, 120, 240].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <circle cx="50" cy="20" r="7" fill="#CC0000" />
          <circle cx="50" cy="20" r="4" fill="#880000" />
          <path d="M50 20 Q62 32 55 42 Q52 38 50 34 Q48 30 50 20Z" fill="#CC0000" opacity="0.85" />
        </g>
      ))}
    </motion.svg>
  );
}

/* ══════════════════════════════════════════════
   CROW BACKGROUND — Itachi's Surveillance Network
   (CSS-driven animation — no SSR window issues)
   ══════════════════════════════════════════════ */
function CrowBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const crows = [
    { top: "8%", delay: 0, size: 30, dur: 22, opacity: 0.06 },
    { top: "15%", delay: 3, size: 22, dur: 28, opacity: 0.04 },
    { top: "25%", delay: 7, size: 35, dur: 20, opacity: 0.05 },
    { top: "40%", delay: 2, size: 18, dur: 32, opacity: 0.03 },
    { top: "55%", delay: 10, size: 28, dur: 25, opacity: 0.05 },
    { top: "65%", delay: 5, size: 24, dur: 30, opacity: 0.04 },
    { top: "75%", delay: 8, size: 32, dur: 23, opacity: 0.06 },
    { top: "85%", delay: 1, size: 20, dur: 35, opacity: 0.03 },
    { top: "35%", delay: 12, size: 26, dur: 27, opacity: 0.04 },
    { top: "50%", delay: 15, size: 20, dur: 33, opacity: 0.03 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {crows.map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: c.top, left: "-80px", opacity: c.opacity }}
          animate={{
            x: ["0vw", "105vw"],
            y: [0, Math.sin(i * 1.3) * 50, Math.cos(i * 0.8) * 30, 0],
          }}
          transition={{
            x: { duration: c.dur, repeat: Infinity, ease: "linear", delay: c.delay },
            y: { duration: c.dur / 2, repeat: Infinity, ease: "easeInOut", delay: c.delay },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/crow.png" alt="" width={c.size} height={c.size * 0.6} style={{ filter: "brightness(0)" }} draggable={false} />
        </motion.div>
      ))}

      {/* Large Sharingan Eyes in background — very faint */}
      <div className="absolute top-[10%] right-[5%] opacity-[0.015]">
        <SharinganEye size={280} spin />
      </div>
      <div className="absolute bottom-[15%] left-[3%] opacity-[0.012]">
        <SharinganEye size={220} spin />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHARINGAN LOADER
   ══════════════════════════════════════════════ */
function SharinganLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="relative">
        <SharinganEye size={80} spin glow />
        {/* Outer scan ring */}
        <motion.div
          className="absolute inset-[-8px] rounded-full border border-sharingan-red/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <motion.p
        className="text-sm font-heading text-sharingan-red/60 tracking-[0.3em] uppercase"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Scanning intelligence
      </motion.p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ARTICLE RANK SYSTEM — based on freshness
   ══════════════════════════════════════════════ */
function getArticleRank(publishedAt: string): { label: string; color: string; borderColor: string; bgColor: string; glow: string } {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const hours = ageMs / (1000 * 60 * 60);

  if (hours < 1) return { label: "BREAKING", color: "#FF2222", borderColor: "border-red-500/50", bgColor: "bg-red-500/10", glow: "shadow-[0_0_12px_rgba(255,34,34,0.3)]" };
  if (hours < 3) return { label: "FRESH", color: "#FF8800", borderColor: "border-orange-500/40", bgColor: "bg-orange-500/10", glow: "shadow-[0_0_8px_rgba(255,136,0,0.2)]" };
  if (hours < 12) return { label: "RECENT", color: "#3388FF", borderColor: "border-blue-500/30", bgColor: "bg-blue-500/10", glow: "" };
  return { label: "FILED", color: "#666680", borderColor: "border-gray-600/20", bgColor: "bg-gray-600/10", glow: "" };
}

/* ══════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════ */
const COUNTRIES = [
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

const LANGUAGES = [
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

const CATEGORIES = [
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

const TTS_LANG_MAP: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN",
  bn: "bn-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
  ur: "ur-PK", fr: "fr-FR", de: "de-DE", ja: "ja-JP", zh: "zh-CN",
  es: "es-ES", pt: "pt-BR", ar: "ar-SA",
};

/* ── Helpers ── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function translateUrl(url: string, targetLang: string): string {
  return `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(url)}`;
}

/** Chakra freshness — 1.0 = just now, 0.0 = 24h+ old */
function chakraLevel(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  return Math.max(0, 1 - ageMs / (24 * 60 * 60 * 1000));
}

/* ══════════════════════════════════════════════
   NARUTO VOICE SYSTEM
   ══════════════════════════════════════════════ */
const NARUTO_INTROS: Record<string, string[]> = {
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

function NarutoChatbot({ lang, onSpeak }: { lang: string; onSpeak: (fn: (text: string) => void) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("Tap the speaker on any article, dattebayo!");
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const h = () => {};
    window.speechSynthesis?.addEventListener?.("voiceschanged", h);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", h);
  }, []);

  const findBestVoice = useCallback((langCode: string) => {
    const voices = window.speechSynthesis?.getVoices() || [];
    const prefix = langCode.split("-")[0];
    const matching = voices.filter(v => v.lang.startsWith(prefix));
    // Prefer natural/neural voices — Edge has great ones
    return matching.find(v => /natural|neural|premium|enhanced|wavenet|online/i.test(v.name)) || matching[0] || null;
  }, []);

  const speak = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setLastMessage(text.length > 80 ? text.slice(0, 80) + "..." : text);

    const nativeLang = TTS_LANG_MAP[lang] || "en-IN";
    const isNonEnglish = lang !== "en";

    const make = (t: string, lc: string, rate = 1.05, pitch = 1.3) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lc;
      u.rate = rate;
      u.pitch = pitch;
      const v = findBestVoice(lc);
      if (v) u.voice = v;
      return u;
    };

    // Naruto intro — energetic, high-pitch (mimicking youthful anime voice)
    const intros = NARUTO_INTROS[lang] || NARUTO_INTROS.en;
    const intro = make(intros[Math.floor(Math.random() * intros.length)], nativeLang, 1.2, 1.45);

    // Read article in native language
    const nativeRead = make(text, nativeLang, 1.05, 1.3);

    if (isNonEnglish) {
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${lang}|en`);
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (translated && translated.toUpperCase() !== text.toUpperCase()) {
          const bridge = make("Now in English, believe it!", "en-IN", 1.15, 1.35);
          const enRead = make(translated, "en-IN", 1.0, 1.2);
          enRead.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(intro);
          window.speechSynthesis.speak(nativeRead);
          window.speechSynthesis.speak(bridge);
          window.speechSynthesis.speak(enRead);
          return;
        }
      } catch { /* fallback */ }
    }

    nativeRead.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(intro);
    window.speechSynthesis.speak(nativeRead);
  }, [lang, findBestVoice]);

  useEffect(() => { onSpeak(speak); }, [lang, speak, onSpeak]);

  useEffect(() => {
    if (hasGreeted) return;
    const t = setTimeout(() => { setIsOpen(true); setHasGreeted(true); setTimeout(() => setIsOpen(false), 4000); }, 3000);
    return () => clearTimeout(t);
  }, [hasGreeted]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="w-80 rounded-2xl bg-[#08080d]/95 backdrop-blur-xl border border-sharingan-red/15 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(204,0,0,0.1)] overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <div className="px-4 py-2.5 bg-gradient-to-r from-sharingan-red/8 to-chakra-orange/8 border-b border-white/[0.04] flex items-center gap-2">
              <SharinganEye size={14} spin glow />
              <span className="text-xs font-heading font-bold text-chakra-orange">Naruto Uzumaki</span>
              <span className="text-[10px] text-mist-gray/50">Voice Ninja</span>
              <button onClick={() => setIsOpen(false)} className="ml-auto text-mist-gray/40 hover:text-white transition-colors">
                <svg viewBox="0 0 12 12" className="w-3.5 h-3.5"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-3">
                <motion.div
                  className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-chakra-orange/30 shadow-[0_0_15px_rgba(255,165,0,0.15)] cursor-pointer"
                  animate={isSpeaking
                    ? { rotate: [0, -5, 5, -3, 0], scale: [1, 1.05, 1] }
                    : { y: [0, -2, 0] }
                  }
                  transition={isSpeaking
                    ? { duration: 0.6, repeat: Infinity }
                    : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }
                  whileHover={{
                    rotate: [0, -12, 15, -8, 10, 0],
                    scale: 1.15,
                    transition: { duration: 0.6 },
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/naruto-avatar.png" alt="Naruto" className="w-full h-full object-cover object-top" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-scroll-cream/90 leading-relaxed">
                    {isSpeaking ? (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        {lastMessage}
                      </motion.span>
                    ) : lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => speak("Dattebayo! I'm Naruto Uzumaki! Hit the speaker button on any news card. I'll read it in your language first, then translate to English! That's my ninja way, believe it!")}
                  className="px-3 py-1.5 rounded-lg bg-chakra-orange/8 border border-chakra-orange/15 text-[10px] font-heading text-chakra-orange hover:bg-chakra-orange/15 transition-colors"
                >
                  How to use?
                </button>
                <button
                  onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
                  className="px-3 py-1.5 rounded-lg bg-sharingan-red/8 border border-sharingan-red/15 text-[10px] font-heading text-sharingan-red hover:bg-sharingan-red/15 transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — Interactive Naruto */}
      <div className="relative group/naruto">
        {/* Hover emote bubble — pops up on hover */}
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/naruto:opacity-100 transition-opacity duration-300"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="px-2.5 py-1 rounded-lg bg-[#08080d]/90 border border-chakra-orange/20 shadow-lg whitespace-nowrap">
            <motion.span
              className="text-[10px] font-heading text-chakra-orange"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Dattebayo!
            </motion.span>
          </div>
          <div className="w-2 h-2 bg-[#08080d]/90 border-r border-b border-chakra-orange/20 rotate-45 mx-auto -mt-1" />
        </motion.div>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 rounded-full overflow-visible"
          whileTap={{ scale: 0.9 }}
          /* Idle: gentle breathing bob */
          animate={isSpeaking
            ? { y: [0, -2, 0, -1, 0] }
            : { y: [0, -3, 0] }
          }
          transition={isSpeaking
            ? { duration: 0.5, repeat: Infinity }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* Avatar container — tilts/waves on hover */}
          <motion.div
            className="w-full h-full rounded-full overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            whileHover={{
              rotate: [0, -10, 12, -8, 5, 0],
              scale: [1, 1.1, 1.08, 1.12, 1.05, 1.1],
              transition: { duration: 0.8, ease: "easeInOut" },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/naruto-avatar.png" alt="Naruto" className="w-full h-full object-cover object-top" />
          </motion.div>

          {/* Ring glow */}
          <div className={`absolute inset-0 rounded-full ring-2 transition-all duration-300 pointer-events-none ${
            isOpen ? "ring-chakra-orange shadow-[0_0_25px_rgba(255,165,0,0.4)]"
            : "ring-sharingan-red/40 group-hover/naruto:ring-chakra-orange group-hover/naruto:shadow-[0_0_20px_rgba(255,165,0,0.3)]"
          }`} />

          {/* Waving hand emoji — appears on hover */}
          <motion.div
            className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-[#08080d] border border-chakra-orange/30 flex items-center justify-center text-sm opacity-0 group-hover/naruto:opacity-100 transition-opacity duration-200 pointer-events-none"
            animate={{ rotate: [0, 20, -10, 20, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
          >
            <span className="text-xs">&#x1F44B;</span>
          </motion.div>

          {/* Speaking pulse rings */}
          {isSpeaking && (
            <>
              <motion.div className="absolute inset-0 rounded-full border-2 border-chakra-orange pointer-events-none" animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 1, repeat: Infinity }} />
              <motion.div className="absolute inset-0 rounded-full border border-chakra-orange/50 pointer-events-none" animate={{ scale: [1, 1.9], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FEATURED HERO CARD — First article, dramatic layout
   ══════════════════════════════════════════════ */
function FeaturedCard({ article, userLang, onVoiceRead }: { article: Article; userLang: string; onVoiceRead: (text: string) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const rank = getArticleRank(article.publishedAt);
  const hasImg = article.image && !imgErr;
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [2, -2]);
  const rotateY = useTransform(mouseX, [0, 1], [-2, 2]);

  return (
    <motion.div
      className="group relative w-full rounded-2xl overflow-hidden mb-6"
      style={{ perspective: 800, rotateX, rotateY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
      }}
      onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Image */}
      <div className="relative aspect-[2.2/1] md:aspect-[3/1]">
        {hasImg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgErr(true)}
            />
            {/* Heavy dark overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08080d]/80 via-transparent to-[#08080d]/60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#12121e] to-[#0a0a12] flex items-center justify-center">
            <SharinganEye size={120} spin className="opacity-[0.06]" />
          </div>
        )}

        {/* Sharingan scanning effect on hover */}
        <motion.div
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-60 transition-opacity duration-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <SharinganEye size={28} glow />
        </motion.div>

        {/* Red border glow on hover */}
        <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-sharingan-red/30 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sharingan-red/0 to-transparent group-hover:via-sharingan-red/50 transition-all duration-700" />

        {/* Content overlaid */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          {/* Rank badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${rank.bgColor} border ${rank.borderColor} ${rank.glow}`}>
              {rank.label === "BREAKING" && (
                <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: rank.color }} animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              )}
              <span className="text-[10px] font-heading font-bold tracking-widest" style={{ color: rank.color }}>{rank.label}</span>
            </div>
            <span className="text-[11px] font-mono text-mist-gray/50">{article.source.name}</span>
            <span className="text-[11px] font-mono text-mist-gray/30">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* Title */}
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
              {article.title}
            </h2>
          </a>

          {/* Description */}
          <p className="text-sm text-mist-gray/70 leading-relaxed line-clamp-2 mb-4 max-w-3xl">
            {article.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onVoiceRead(`${article.title}. ${article.description}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-chakra-orange/10 border border-chakra-orange/20 hover:bg-chakra-orange/20 transition-all"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-chakra-orange"><path d="M8 2L4 6H1v4h3l4 4V2z" fill="currentColor" /><path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
              <span className="text-[10px] font-heading text-chakra-orange tracking-wider">VOICE</span>
            </button>
            <a
              href={translateUrl(article.url, userLang === "en" ? "en" : "en")}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rasengan-blue/10 border border-rasengan-blue/20 hover:bg-rasengan-blue/20 transition-all"
            >
              <span className="text-[10px] font-heading text-rasengan-blue tracking-wider">TRANSLATE</span>
            </a>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all ml-auto">
              <span className="text-[10px] font-heading text-white/70 tracking-wider">READ FULL</span>
              <svg viewBox="0 0 12 12" className="w-3 h-3 text-white/50"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   NEWS CARD — Vertical, transforming, never-before-seen
   ══════════════════════════════════════════════ */
function NewsCard({ article, index, userLang, onVoiceRead }: { article: Article; index: number; userLang: string; onVoiceRead: (text: string) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rank = getArticleRank(article.publishedAt);
  const hasImg = article.image && !imgErr;
  const freshness = chakraLevel(article.publishedAt);

  return (
    <motion.div
      className="group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300
        bg-[#0a0a10]/90 backdrop-blur-sm
        border border-white/[0.04]
        hover:border-sharingan-red/25
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(204,0,0,0.08)]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Image area */}
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="relative aspect-[16/9] overflow-hidden">
        {hasImg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={() => setImgErr(true)}
              loading="lazy"
            />
            {/* Cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-transparent to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a10]/40 via-transparent to-transparent" />
          </>
        ) : (
          /* No-image placeholder — Sharingan pattern */
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c16] via-[#10101c] to-[#0a0a12] flex items-center justify-center">
            <SharinganEye size={50} className="opacity-[0.08]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0a0a10_70%)]" />
          </div>
        )}

        {/* Rank badge — top left */}
        <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md ${rank.bgColor} border ${rank.borderColor} backdrop-blur-sm ${rank.glow}`}>
          {rank.label === "BREAKING" && (
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rank.color }} animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
          )}
          <span className="text-[8px] font-heading font-bold tracking-[0.15em]" style={{ color: rank.color }}>{rank.label}</span>
        </div>

        {/* Sharingan — appears on hover, scans across */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="absolute top-2.5 right-2.5"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.7, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
            >
              <SharinganEye size={20} spin glow />
            </motion.div>
          )}
        </AnimatePresence>
      </a>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Source + Time */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-mist-gray/50 uppercase tracking-wider truncate">
            {article.source.name}
          </span>
          <span className="text-[10px] font-mono text-mist-gray/30 flex-shrink-0">
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          <h3 className="text-[13px] font-heading font-semibold text-white/90 leading-snug line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
            {article.title}
          </h3>
        </a>

        {/* Description — expands on hover */}
        <p className={`text-[11px] text-mist-gray/50 leading-relaxed transition-all duration-300 ${hovered ? "line-clamp-4" : "line-clamp-2"}`}>
          {article.description}
        </p>

        {/* Chakra Freshness Bar */}
        <div className="mt-3 mb-3">
          <div className="h-[2px] rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${freshness * 100}%`,
                background: freshness > 0.7 ? "linear-gradient(90deg, #CC0000, #FF4400)" : freshness > 0.3 ? "linear-gradient(90deg, #FF8800, #FFAA00)" : "linear-gradient(90deg, #3388FF, #5599FF)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${freshness * 100}%` }}
              transition={{ duration: 1, delay: index * 0.06 + 0.3 }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={() => onVoiceRead(`${article.title}. ${article.description}`)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-chakra-orange/6 border border-chakra-orange/10 hover:bg-chakra-orange/15 hover:border-chakra-orange/25 transition-all"
            title="Naruto reads aloud"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-chakra-orange/60 group-hover:text-chakra-orange"><path d="M8 2L4 6H1v4h3l4 4V2z" fill="currentColor" /><path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            <span className="text-[8px] font-heading text-chakra-orange/60 group-hover:text-chakra-orange tracking-wider">VOICE</span>
          </button>
          <a
            href={translateUrl(article.url, "en")}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rasengan-blue/6 border border-rasengan-blue/10 hover:bg-rasengan-blue/15 hover:border-rasengan-blue/25 transition-all"
          >
            <span className="text-[8px] font-heading text-rasengan-blue/60 tracking-wider">TRANSLATE</span>
          </a>
        </div>
      </div>

      {/* Bottom glow line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sharingan-red/0 to-transparent group-hover:via-sharingan-red/30 transition-all duration-700" />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   TRENDING BAR
   ══════════════════════════════════════════════ */
function TrendingBar({ topics, region }: { topics: TrendingTopic[]; region: string | null }) {
  if (topics.length === 0) return null;
  return (
    <motion.div className="mb-6 rounded-xl border border-chakra-orange/10 bg-[#0a0a10]/60 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="px-4 py-2.5 border-b border-chakra-orange/8 flex items-center gap-2">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-chakra-orange"><path d="M8 1l2 4 4.5.5-3.25 3 .75 4.5L8 11l-4 2 .75-4.5L1.5 5.5 6 5z" fill="currentColor" /></svg>
        </motion.div>
        <span className="text-xs font-heading font-bold text-chakra-orange uppercase tracking-wider">Trending {region ? `in ${region}` : ""}</span>
        <span className="text-[10px] text-mist-gray/40 ml-auto font-mono">Google Trends</span>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
        {topics.map((t, i) => (
          <a key={`${t.title}-${i}`} href={t.url || `https://www.google.com/search?q=${encodeURIComponent(t.title)}`} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-chakra-orange/5 border border-chakra-orange/10 text-xs font-heading text-scroll-cream hover:bg-chakra-orange/15 hover:border-chakra-orange/25 transition-all">
            <span className="text-chakra-orange mr-1.5">#{i + 1}</span>{t.title}
            {t.traffic && <span className="ml-1.5 text-[10px] text-mist-gray/40">{t.traffic}</span>}
          </a>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   SOCIAL PULSE
   ══════════════════════════════════════════════ */
const PLAT: Record<string, { color: string; icon: string }> = {
  reddit: { color: "#FF4500", icon: "R" }, bluesky: { color: "#0085FF", icon: "B" },
  youtube: { color: "#FF0000", icon: "Y" }, wikipedia: { color: "#636466", icon: "W" },
};

function SocialPulse({ posts, platforms }: { posts: SocialPost[]; platforms: string[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({});
  const total = Math.min(posts.length, 12);

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => setActive((p) => (p + 1) % total), 3000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, paused]);

  useEffect(() => { setActive(0); setImgErr({}); }, [posts]);

  if (posts.length === 0) return null;
  const post = posts[active];
  if (!post) return null;
  const s = PLAT[post.platform] || PLAT.reddit;
  const hasImg = post.image && !imgErr[active];

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <SharinganEye size={16} spin />
        <h2 className="text-base font-heading font-bold text-scroll-cream">Social Pulse</h2>
        <div className="flex items-center gap-1.5 ml-1">
          {platforms.map((p) => (
            <span key={p} className="px-2 py-0.5 rounded-full text-[9px] font-heading font-medium border border-white/[0.06] bg-white/[0.02]" style={{ color: PLAT[p.toLowerCase()]?.color || "#888" }}>{p}</span>
          ))}
        </div>
      </div>

      {/* Carousel card */}
      <div
        className="relative rounded-2xl border border-white/[0.05] bg-[#0a0a10]/70 backdrop-blur-sm overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.a
            key={`social-${active}`}
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex flex-col md:flex-row">
              {/* Image — large, takes left half on desktop */}
              <div className="relative w-full md:w-[45%] aspect-[16/9] md:aspect-auto md:min-h-[200px] overflow-hidden flex-shrink-0">
                {hasImg ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image!}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={() => setImgErr((prev) => ({ ...prev, [active]: true }))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a10]/80 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] to-transparent md:hidden" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e18] to-[#0a0a10] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                      {s.icon}
                    </div>
                  </div>
                )}

                {/* Platform badge — top left */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md" style={{ backgroundColor: `${s.color}20`, border: `1px solid ${s.color}30` }}>
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: s.color }}>{s.icon}</span>
                  <span className="text-[10px] font-heading font-semibold" style={{ color: s.color }}>
                    {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                  </span>
                </div>
              </div>

              {/* Content — right side */}
              <div className="flex-1 p-5 md:p-6 flex flex-col justify-center min-w-0">
                {/* Author + meta */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-[11px] font-mono text-mist-gray/50 truncate">{post.author}</span>
                  {post.score > 0 && (
                    <span className="text-[11px] font-mono font-medium" style={{ color: s.color }}>
                      {post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                      {post.platform === "reddit" ? " upvotes" : post.platform === "wikipedia" ? " views" : " likes"}
                    </span>
                  )}
                </div>

                {/* Title — big and clear */}
                <h3 className="text-base md:text-lg font-heading font-bold text-white/90 leading-snug line-clamp-3 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
                  {post.title}
                </h3>

                {/* Text preview if available */}
                {post.text && post.text !== post.title && (
                  <p className="text-[12px] text-mist-gray/40 leading-relaxed line-clamp-2 mb-3">
                    {post.text}
                  </p>
                )}

                {/* Comments + read more */}
                <div className="flex items-center gap-3 mt-auto">
                  {post.comments !== undefined && post.comments > 0 && (
                    <span className="text-[11px] text-mist-gray/35 flex items-center gap-1">
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5"><path d="M2 3h12v7H5l-3 3V3z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                      {post.comments > 1000 ? `${(post.comments / 1000).toFixed(1)}k` : post.comments} comments
                    </span>
                  )}
                  <span className="text-[11px] font-heading tracking-wider uppercase ml-auto flex items-center gap-1 group-hover:text-white transition-colors" style={{ color: `${s.color}99` }}>
                    Read
                    <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                  </span>
                </div>
              </div>
            </div>
          </motion.a>
        </AnimatePresence>

        {/* Navigation overlay — arrows on sides */}
        <button
          onClick={(e) => { e.preventDefault(); setActive((active - 1 + total) % total); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-black/60 transition-all z-10"
        >
          <svg viewBox="0 0 12 12" className="w-4 h-4"><path d="M8 2L4 6l4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); setActive((active + 1) % total); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-black/60 transition-all z-10"
        >
          <svg viewBox="0 0 12 12" className="w-4 h-4"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>

        {/* Progress bar + dots at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 pb-2.5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? "w-5 h-1.5" : "w-1.5 h-1.5 opacity-30 hover:opacity-60"
                }`}
                style={{ backgroundColor: i === active ? s.color : "#fff" }}
              />
            ))}
          </div>
          {/* Progress line */}
          <div className="h-[2px] bg-white/[0.03]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: s.color, opacity: 0.6 }}
              key={`progress-${active}-${paused}`}
              initial={{ width: "0%" }}
              animate={{ width: paused ? undefined : "100%" }}
              transition={paused ? {} : { duration: 3, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function TrendingPage() {
  const [country, setCountry] = useState("in");
  const [lang, setLang] = useState("en");
  const [category, setCategory] = useState("general");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freshCount, setFreshCount] = useState(0);
  const [showCountries, setShowCountries] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const speakRef = useRef<((text: string) => void) | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/news?category=${category}&country=${country}&lang=${lang}&max=12`);
      const data: ApiResponse = await res.json();
      if (data.error) { setError(data.error); setArticles([]); }
      else { setArticles(data.articles || []); setFreshCount(data.freshCount || 0); setActiveSources(data.sources || []); setTrending(data.trending || []); setRegion(data.region || null); }
    } catch { setError("Failed to fetch news. Check your connection."); }
    finally { setLoading(false); }
  }, [category, country, lang]);

  const fetchSocial = useCallback(async () => {
    try { const res = await fetch(`/api/social?country=${country}&lang=${lang}&category=${category}`); const data: SocialResponse = await res.json(); setSocialPosts(data.posts || []); setSocialPlatforms(data.platforms || []); }
    catch { /* silent */ }
  }, [country, lang, category]);

  useEffect(() => { fetchNews(); fetchSocial(); }, [fetchNews, fetchSocial]);
  useEffect(() => { const iv = setInterval(() => { fetchNews(); fetchSocial(); }, 60000); return () => clearInterval(iv); }, [fetchNews, fetchSocial]);

  const handleVoiceRead = useCallback((text: string) => { speakRef.current?.(text); }, []);
  const activeCountry = COUNTRIES.find((c) => c.code === country);
  const activeLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <Navbar />
      <CrowBackground />

      <main id="main-content" className="relative z-10 min-h-screen pt-20 px-4 md:px-6 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-5 mb-3">
              <SharinganEye size={36} spin glow className="hidden md:block" />
              <h1 className="font-brand text-3xl md:text-5xl text-gradient-orange">
                Trending Battleground
              </h1>
              <SharinganEye size={36} spin glow className="hidden md:block" />
            </div>
            <p className="text-mist-gray/50 font-heading text-sm md:text-base tracking-wide">
              Live intelligence — auto-refreshes every minute
            </p>

            {region && (
              <motion.div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-amaterasu-purple/10 border border-amaterasu-purple/15" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <SharinganEye size={12} />
                <span className="text-xs font-heading text-amaterasu-purple font-medium">Showing news from {region}</span>
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {freshCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-green/8 border border-sage-green/15">
                  <motion.div className="w-2 h-2 rounded-full bg-sage-green" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <span className="text-xs font-heading text-sage-green">{freshCount} breaking in the last hour</span>
                </div>
              )}
              {activeSources.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rasengan-blue/8 border border-rasengan-blue/15">
                  <span className="text-xs font-heading text-rasengan-blue">{activeSources.length} sources active</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── FILTERS ── */}
          <motion.div className="flex flex-wrap items-center gap-3 mb-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {/* Country */}
            <div className="relative">
              <button onClick={() => { setShowCountries(!showCountries); setShowLanguages(false); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm font-heading text-scroll-cream hover:border-sharingan-red/20 transition-all">
                <span>{activeCountry?.flag}</span><span>{activeCountry?.label}</span>
                <svg className={`w-3 h-3 transition-transform ${showCountries ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3" /></svg>
              </button>
              <AnimatePresence>
                {showCountries && (
                  <motion.div className="absolute top-full mt-1 left-0 z-50 w-48 max-h-64 overflow-y-auto rounded-xl bg-[#0c0c14]/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {COUNTRIES.map((c) => (
                      <button key={c.code} onClick={() => { setCountry(c.code); setShowCountries(false); }}
                        className={`w-full px-3 py-2 text-left text-sm font-heading flex items-center gap-2 hover:bg-white/[0.04] transition-colors ${country === c.code ? "text-chakra-orange" : "text-scroll-cream/80"}`}>
                        <span>{c.flag}</span> {c.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language */}
            <div className="relative">
              <button onClick={() => { setShowLanguages(!showLanguages); setShowCountries(false); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm font-heading text-scroll-cream hover:border-sharingan-red/20 transition-all">
                <span>{activeLang?.label}</span>
                {activeLang?.region && <span className="text-[10px] text-amaterasu-purple/70">({activeLang.region})</span>}
                <svg className={`w-3 h-3 transition-transform ${showLanguages ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3" /></svg>
              </button>
              <AnimatePresence>
                {showLanguages && (
                  <motion.div className="absolute top-full mt-1 left-0 z-50 w-56 max-h-72 overflow-y-auto rounded-xl bg-[#0c0c14]/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {LANGUAGES.map((l) => (
                      <button key={l.code} onClick={() => { setLang(l.code); setShowLanguages(false); }}
                        className={`w-full px-3 py-2 text-left text-sm font-heading hover:bg-white/[0.04] transition-colors flex items-center justify-between ${lang === l.code ? "text-chakra-orange" : "text-scroll-cream/80"}`}>
                        <span>{l.label}</span>
                        {l.region && <span className="text-[10px] text-mist-gray/40">{l.region}</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Translate Page */}
            <button onClick={() => window.open(`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(window.location.href)}`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rasengan-blue/6 border border-rasengan-blue/12 text-xs font-heading text-rasengan-blue hover:bg-rasengan-blue/12 transition-all">
              Translate Page
            </button>

            {/* Refresh */}
            <button onClick={fetchNews} disabled={loading}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sage-green/6 border border-sage-green/12 text-xs font-heading text-sage-green hover:bg-sage-green/12 transition-all disabled:opacity-50">
              <motion.svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                animate={loading ? { rotate: 360 } : {}} transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                <path d="M14 8A6 6 0 1 1 8 2" /><path d="M8 2l2.5-1L9 4" />
              </motion.svg>
              Refresh
            </button>
          </motion.div>

          {/* ── CATEGORIES ── */}
          <motion.div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all ${
                  category === cat.id
                    ? "bg-sharingan-red/12 text-white border border-sharingan-red/25 shadow-[0_0_15px_rgba(204,0,0,0.12)]"
                    : "bg-white/[0.02] text-mist-gray/60 border border-white/[0.04] hover:text-white hover:border-white/[0.08]"
                }`}>
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* TRENDING */}
          <TrendingBar topics={trending} region={region} />
          {/* SOCIAL */}
          <SocialPulse posts={socialPosts} platforms={socialPlatforms} />

          {/* ERROR */}
          {error && (
            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-sharingan-red/5 border border-sharingan-red/15">
                <SharinganEye size={40} glow />
                <p className="text-sm text-sharingan-red font-heading">{error}</p>
              </div>
            </motion.div>
          )}

          {/* LOADING */}
          {loading && !error && <SharinganLoader />}

          {/* ── NEWS — Featured hero + grid ── */}
          {!loading && !error && articles.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {/* Hero — first article */}
              <FeaturedCard
                article={articles[0]}
                userLang={lang}
                onVoiceRead={handleVoiceRead}
              />

              {/* Grid — rest of articles (vertical cards, 3 cols) */}
              {articles.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articles.slice(1).map((article, i) => (
                    <NewsCard
                      key={`${article.url}-${i}`}
                      article={article}
                      index={i}
                      userLang={lang}
                      onVoiceRead={handleVoiceRead}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* EMPTY */}
          {!loading && !error && articles.length === 0 && (
            <motion.div className="text-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SharinganEye size={60} className="mx-auto mb-5 opacity-20" />
              <p className="text-mist-gray/60 font-heading text-lg">No intel found for this mission.</p>
              <p className="text-mist-gray/30 text-sm mt-2">Try a different country, language, or category.</p>
            </motion.div>
          )}
        </div>
      </main>

      <NarutoChatbot lang={lang} onSpeak={(fn) => { speakRef.current = fn; }} />
      <Footer />
    </>
  );
}
