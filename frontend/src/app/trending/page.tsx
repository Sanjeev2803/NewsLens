"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/* ── Types ── */
interface Article {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

interface TrendingTopic {
  title: string;
  traffic: string;
  relatedQueries: string[];
  url: string;
}

interface SocialPost {
  title: string;
  text: string;
  url: string;
  image: string | null;
  author: string;
  platform: "reddit" | "bluesky" | "youtube" | "wikipedia";
  score: number;
  timestamp: string;
  comments?: number;
}

interface ApiResponse {
  articles: Article[];
  totalArticles: number;
  freshCount: number;
  sources?: string[];
  trending?: TrendingTopic[];
  region?: string | null;
  error?: string;
}

interface SocialResponse {
  posts: SocialPost[];
  platforms: string[];
}

/* ── Filter Data ── */
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
  { id: "general", label: "Top Stories", icon: "\u{1F4F0}" },
  { id: "nation", label: "Regional", icon: "\u{1F3DB}\uFE0F" },
  { id: "world", label: "International", icon: "\u{1F30D}" },
  { id: "sports", label: "Sports", icon: "\u26BD" },
  { id: "entertainment", label: "Entertainment", icon: "\u{1F3AC}" },
  { id: "technology", label: "Technology", icon: "\u{1F4BB}" },
  { id: "business", label: "Business", icon: "\u{1F4CA}" },
  { id: "science", label: "Science", icon: "\u{1F52C}" },
  { id: "health", label: "Health", icon: "\u{1F3E5}" },
];

// TTS language codes for browser Speech Synthesis
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

function isWithinHour(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 60 * 60 * 1000;
}

/* ── Translate Helper ── */
function translateUrl(url: string, targetLang: string): string {
  return `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(url)}`;
}

/* ── Naruto Chatbot Assistant ── */
function NarutoChatbot({ lang, onSpeak }: { lang: string; onSpeak: (fn: (text: string) => void) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("Can I summarize this for you, Hokage?");
  const [hasGreeted, setHasGreeted] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TTS_LANG_MAP[lang] || "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setLastMessage(text.length > 80 ? text.slice(0, 80) + "..." : text);
  }, [lang]);

  useEffect(() => {
    onSpeak(speak);
  }, [lang, speak, onSpeak]);

  // Auto-greet after 3 seconds
  useEffect(() => {
    if (hasGreeted) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasGreeted(true);
      setTimeout(() => setIsOpen(false), 4000);
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasGreeted]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Chat bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="w-72 rounded-xl bg-ink-black border border-sage-green/30 shadow-[0_0_20px_rgba(45,198,83,0.15)] overflow-hidden"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <div className="px-3 py-2 bg-sage-green/10 border-b border-sage-green/15 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sage-green animate-pulse" />
              <span className="text-xs font-heading font-bold text-sage-green">Naruto</span>
              <span className="text-[10px] text-mist-gray">Voice Assistant</span>
              <button onClick={() => setIsOpen(false)} className="ml-auto text-mist-gray hover:text-scroll-cream">
                <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
            </div>

            {/* Message */}
            <div className="p-3">
              <div className="flex gap-2">
                {/* Naruto avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chakra-orange/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <circle cx="12" cy="14" r="6" fill="#FFD699" />
                    <line x1="6" y1="13" x2="9" y2="13.5" stroke="#CC8833" strokeWidth="0.5" />
                    <line x1="6" y1="15" x2="9" y2="14.5" stroke="#CC8833" strokeWidth="0.5" />
                    <line x1="15" y1="13.5" x2="18" y2="13" stroke="#CC8833" strokeWidth="0.5" />
                    <line x1="15" y1="14.5" x2="18" y2="15" stroke="#CC8833" strokeWidth="0.5" />
                    <circle cx="10" cy="13.5" r="1" fill="#0088CC" />
                    <circle cx="14" cy="13.5" r="1" fill="#0088CC" />
                    <rect x="7" y="8" width="10" height="3" rx="1" fill="#2DC653" opacity="0.8" />
                    <path d="M11 17 Q12 18.5 13 17" fill="none" stroke="#CC5533" strokeWidth="0.6" />
                  </svg>
                </div>

                <div className="flex-1">
                  <p className="text-xs text-scroll-cream leading-relaxed">
                    {isSpeaking ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        {lastMessage}
                      </motion.span>
                    ) : (
                      lastMessage
                    )}
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => speak("Dattebayo! I'm Naruto, your news assistant. Click the speaker icon on any article and I'll read it for you, Hokage!")}
                  className="px-2 py-1 rounded-md bg-sage-green/10 border border-sage-green/20 text-[10px] font-heading text-sage-green hover:bg-sage-green/20 transition-colors"
                >
                  How to use?
                </button>
                <button
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setIsSpeaking(false);
                  }}
                  className="px-2 py-1 rounded-md bg-sharingan-red/10 border border-sharingan-red/20 text-[10px] font-heading text-sharingan-red hover:bg-sharingan-red/20 transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isOpen
            ? "bg-sage-green shadow-[0_0_20px_rgba(45,198,83,0.4)]"
            : "bg-ink-black border border-sage-green/30 hover:border-sage-green/50 shadow-[0_0_10px_rgba(45,198,83,0.15)]"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.15, 1] } : {}}
          transition={isSpeaking ? { duration: 0.6, repeat: Infinity } : {}}
        >
          <svg viewBox="0 0 28 28" className="w-7 h-7">
            <circle cx="14" cy="16" r="7" fill="#FFD699" />
            <line x1="7" y1="15" x2="10" y2="15.5" stroke="#CC8833" strokeWidth="0.6" />
            <line x1="7" y1="17" x2="10" y2="16.5" stroke="#CC8833" strokeWidth="0.6" />
            <line x1="18" y1="15.5" x2="21" y2="15" stroke="#CC8833" strokeWidth="0.6" />
            <line x1="18" y1="16.5" x2="21" y2="17" stroke="#CC8833" strokeWidth="0.6" />
            <circle cx="12" cy="15.5" r="1.2" fill="#0088CC" />
            <circle cx="16" cy="15.5" r="1.2" fill="#0088CC" />
            <rect x="9" y="9" width="10" height="3.5" rx="1.5" fill={isOpen ? "#0A0A0F" : "#2DC653"} opacity="0.9" />
            {isSpeaking ? (
              <ellipse cx="14" cy="19.5" rx="2" ry="1.2" fill="#CC5533" />
            ) : (
              <path d="M12 19 Q14 20.5 16 19" fill="none" stroke="#CC5533" strokeWidth="0.7" />
            )}
          </svg>
        </motion.div>

        {/* Pulse ring */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-sage-green"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  );
}

/* ── News Card — compact with small thumbnail ── */
function NewsCard({
  article,
  index,
  userLang,
  onVoiceRead,
}: {
  article: Article;
  index: number;
  userLang: string;
  onVoiceRead: (text: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const fresh = isWithinHour(article.publishedAt);
  const hasImage = article.image && !imgError;

  return (
    <motion.div
      className="group relative flex rounded-lg border border-mist-gray/10 bg-ink-black/60 backdrop-blur-sm overflow-hidden hover:border-sage-green/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      {/* Thumbnail — small fixed size */}
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
        <div className="relative w-28 h-24 md:w-32 md:h-28 bg-ink-black/80 overflow-hidden">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.image!}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-ink-black to-shadow-dark">
              <svg viewBox="0 0 40 40" className="w-6 h-6 opacity-20">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#2DC653" strokeWidth="1.5" />
              </svg>
            </div>
          )}
          {fresh && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-sage-green/90 text-[8px] font-heading font-bold text-shadow-dark uppercase">
              Live
            </div>
          )}
        </div>
      </a>

      {/* Content */}
      <div className="flex flex-col flex-1 p-2.5 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-mono text-sage-green/80 uppercase tracking-wider truncate">
            {article.source.name}
          </span>
          <span className="text-[9px] font-mono text-mist-gray/60 flex-shrink-0">
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        <a href={article.url} target="_blank" rel="noopener noreferrer">
          <h3 className="text-xs font-heading font-semibold text-scroll-cream leading-snug line-clamp-2 mb-1 hover:text-chakra-orange transition-colors">
            {article.title}
          </h3>
        </a>

        <p className="text-[10px] text-mist-gray leading-relaxed line-clamp-1">
          {article.description}
        </p>

        {/* Action buttons — compact row */}
        <div className="flex items-center gap-1 mt-auto pt-1">
          <button
            onClick={() => onVoiceRead(`${article.title}. ${article.description}`)}
            className="p-0.5 rounded hover:bg-sage-green/10 transition-colors"
            title="Read aloud"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-mist-gray/60 hover:text-sage-green">
              <path d="M8 2L4 6H1v4h3l4 4V2z" fill="currentColor" />
              <path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <a
            href={translateUrl(article.url, userLang === "en" ? "en" : "en")}
            target="_blank"
            rel="noopener noreferrer"
            className="px-1.5 py-0.5 rounded text-[9px] font-heading text-rasengan-blue/70 hover:text-rasengan-blue hover:bg-rasengan-blue/10 transition-colors"
            title="Translate"
          >
            Translate
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Trending Topics Bar ── */
function TrendingBar({ topics, region }: { topics: TrendingTopic[]; region: string | null }) {
  if (topics.length === 0) return null;

  return (
    <motion.div
      className="mb-6 rounded-xl border border-chakra-orange/15 bg-ink-black/40 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="px-4 py-2.5 border-b border-chakra-orange/10 flex items-center gap-2">
        <svg viewBox="0 0 16 16" className="w-4 h-4 text-chakra-orange">
          <path d="M8 1l2 4 4.5.5-3.25 3 .75 4.5L8 11l-4 2 .75-4.5L1.5 5.5 6 5z" fill="currentColor" />
        </svg>
        <span className="text-xs font-heading font-bold text-chakra-orange uppercase tracking-wider">
          Trending Now {region ? `in ${region}` : ""}
        </span>
        <span className="text-[10px] text-mist-gray ml-auto font-mono">Google Trends</span>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
        {topics.map((topic, i) => (
          <a
            key={`${topic.title}-${i}`}
            href={topic.url || `https://www.google.com/search?q=${encodeURIComponent(topic.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-chakra-orange/5 border border-chakra-orange/15 text-xs font-heading text-scroll-cream hover:bg-chakra-orange/15 hover:border-chakra-orange/30 transition-all"
          >
            <span className="text-chakra-orange mr-1">#{i + 1}</span>
            {topic.title}
            {topic.traffic && (
              <span className="ml-1.5 text-[10px] text-mist-gray">{topic.traffic}</span>
            )}
          </a>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Social Pulse Section ── */
const PLATFORM_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  reddit: { color: "#FF4500", icon: "R", bg: "bg-[#FF4500]/10 border-[#FF4500]/20" },
  bluesky: { color: "#0085FF", icon: "B", bg: "bg-[#0085FF]/10 border-[#0085FF]/20" },
  youtube: { color: "#FF0000", icon: "Y", bg: "bg-[#FF0000]/10 border-[#FF0000]/20" },
  wikipedia: { color: "#636466", icon: "W", bg: "bg-[#636466]/10 border-[#636466]/20" },
};

function SocialPulse({ posts, platforms }: { posts: SocialPost[]; platforms: string[] }) {
  if (posts.length === 0) return null;

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-heading font-bold text-scroll-cream">Social Pulse</h2>
        <div className="flex items-center gap-1.5">
          {platforms.map((p) => (
            <span
              key={p}
              className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-medium border ${
                PLATFORM_STYLES[p.toLowerCase()]?.bg || "bg-mist-gray/10 border-mist-gray/20"
              }`}
              style={{ color: PLATFORM_STYLES[p.toLowerCase()]?.color || "#8B8BA3" }}
            >
              {p}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-mist-gray ml-auto font-mono">alt sources (no X needed)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {posts.slice(0, 8).map((post, i) => {
          const style = PLATFORM_STYLES[post.platform] || PLATFORM_STYLES.reddit;
          return (
            <motion.a
              key={`${post.url}-${i}`}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-lg border border-mist-gray/10 bg-ink-black/40 backdrop-blur-sm overflow-hidden hover:border-mist-gray/25 transition-all group"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              whileHover={{ y: -2 }}
            >
              {/* Image if available */}
              {post.image && (
                <div className="relative w-full aspect-[2/1] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              <div className="p-3 flex flex-col flex-1">
                {/* Platform badge + score */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ backgroundColor: style.color }}
                  >
                    {style.icon}
                  </span>
                  <span className="text-[10px] font-mono text-mist-gray truncate">{post.author}</span>
                  {post.score > 0 && (
                    <span className="text-[10px] font-mono ml-auto" style={{ color: style.color }}>
                      {post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                      {post.platform === "reddit" ? " pts" : post.platform === "wikipedia" ? " views" : " likes"}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-heading font-semibold text-scroll-cream line-clamp-2 leading-snug">
                  {post.title}
                </h4>

                {post.comments !== undefined && post.comments > 0 && (
                  <span className="text-[10px] text-mist-gray mt-1">
                    {post.comments} comments
                  </span>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Main Page ── */
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/news?category=${category}&country=${country}&lang=${lang}&max=10`
      );
      const data: ApiResponse = await res.json();
      if (data.error) {
        setError(data.error);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
        setFreshCount(data.freshCount || 0);
        setActiveSources(data.sources || []);
        setTrending(data.trending || []);
        setRegion(data.region || null);
      }
    } catch {
      setError("Failed to fetch news. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [category, country, lang]);

  const fetchSocial = useCallback(async () => {
    try {
      const res = await fetch(`/api/social?country=${country}&lang=${lang}&category=${category}`);
      const data: SocialResponse = await res.json();
      setSocialPosts(data.posts || []);
      setSocialPlatforms(data.platforms || []);
    } catch {
      // silent fail — social is supplementary
    }
  }, [country, lang, category]);

  useEffect(() => {
    fetchNews();
    fetchSocial();
  }, [fetchNews, fetchSocial]);

  useEffect(() => {
    const interval = setInterval(() => { fetchNews(); fetchSocial(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchNews, fetchSocial]);

  const handleVoiceRead = useCallback((text: string) => {
    speakRef.current?.(text);
  }, []);

  const activeCountry = COUNTRIES.find((c) => c.code === country);
  const activeLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-4 md:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-brand text-3xl md:text-5xl text-gradient-orange mb-2">
              Trending Battleground
            </h1>
            <p className="text-mist-gray font-heading text-sm md:text-base">
              Live intelligence — auto-refreshes every minute
            </p>

            {/* Regional Context Banner */}
            {region && (
              <motion.div
                className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-amaterasu-purple/10 border border-amaterasu-purple/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-amaterasu-purple">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="8" r="2" fill="currentColor" />
                </svg>
                <span className="text-xs font-heading text-amaterasu-purple font-medium">
                  Showing news from {region}
                </span>
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {freshCount > 0 && (
                <motion.div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-green/10 border border-sage-green/20"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [0.9, 1.05, 1] }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="w-2 h-2 rounded-full bg-sage-green animate-pulse" />
                  <span className="text-xs font-heading text-sage-green">
                    {freshCount} articles from the last hour
                  </span>
                </motion.div>
              )}
              {activeSources.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rasengan-blue/10 border border-rasengan-blue/20">
                  <span className="text-xs font-heading text-rasengan-blue">
                    {activeSources.length} sources: {activeSources.slice(0, 4).join(" \u00B7 ")}{activeSources.length > 4 ? ` +${activeSources.length - 4}` : ""}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Filters Row */}
          <motion.div
            className="flex flex-wrap items-center gap-3 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Country Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowCountries(!showCountries); setShowLanguages(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-black/60 border border-mist-gray/15 text-sm font-heading text-scroll-cream hover:border-sage-green/30 transition-colors"
              >
                <span>{activeCountry?.flag}</span>
                <span>{activeCountry?.label}</span>
                <svg className={`w-3 h-3 transition-transform ${showCountries ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3" /></svg>
              </button>
              <AnimatePresence>
                {showCountries && (
                  <motion.div
                    className="absolute top-full mt-1 left-0 z-50 w-48 max-h-64 overflow-y-auto rounded-lg bg-ink-black border border-mist-gray/15 shadow-modal py-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCountry(c.code); setShowCountries(false); }}
                        className={`w-full px-3 py-2 text-left text-sm font-heading flex items-center gap-2 hover:bg-sage-green/10 transition-colors ${country === c.code ? "text-sage-green bg-sage-green/5" : "text-scroll-cream"}`}
                      >
                        <span>{c.flag}</span> {c.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowLanguages(!showLanguages); setShowCountries(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-black/60 border border-mist-gray/15 text-sm font-heading text-scroll-cream hover:border-sage-green/30 transition-colors"
              >
                <span className="text-xs">{"\u{1F5E3}\uFE0F"}</span>
                <span>{activeLang?.label}</span>
                {activeLang?.region && (
                  <span className="text-[10px] text-amaterasu-purple">({activeLang.region})</span>
                )}
                <svg className={`w-3 h-3 transition-transform ${showLanguages ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3" /></svg>
              </button>
              <AnimatePresence>
                {showLanguages && (
                  <motion.div
                    className="absolute top-full mt-1 left-0 z-50 w-56 max-h-72 overflow-y-auto rounded-lg bg-ink-black border border-mist-gray/15 shadow-modal py-1"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code); setShowLanguages(false); }}
                        className={`w-full px-3 py-2 text-left text-sm font-heading hover:bg-sage-green/10 transition-colors flex items-center justify-between ${lang === l.code ? "text-sage-green bg-sage-green/5" : "text-scroll-cream"}`}
                      >
                        <span>{l.label}</span>
                        {l.region && <span className="text-[10px] text-mist-gray">{l.region}</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Translate Page button */}
            <button
              onClick={() => {
                const url = window.location.href;
                window.open(`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(url)}`, "_blank");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rasengan-blue/10 border border-rasengan-blue/20 text-xs font-heading text-rasengan-blue hover:bg-rasengan-blue/20 transition-colors"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
                <path d="M2 3h5M4.5 1v2M3 3c.5 2.5 2 4 4 5M7 3c-.5 2.5-2 4-4 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9 8l2 5 2-5M9.5 11h3" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Translate Page
            </button>

            {/* Refresh */}
            <button
              onClick={fetchNews}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sage-green/10 border border-sage-green/20 text-xs font-heading text-sage-green hover:bg-sage-green/20 transition-colors disabled:opacity-50"
            >
              <motion.svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                animate={loading ? { rotate: 360 } : {}}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <path d="M14 8A6 6 0 1 1 8 2" />
                <path d="M8 2l2.5-1L9 4" />
              </motion.svg>
              Refresh
            </button>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-heading font-medium transition-all ${
                  category === cat.id
                    ? "bg-sage-green/20 text-sage-green border border-sage-green/30 shadow-[0_0_12px_rgba(45,198,83,0.2)]"
                    : "bg-ink-black/40 text-mist-gray border border-mist-gray/10 hover:text-scroll-cream hover:border-mist-gray/25"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Trending Topics Bar */}
          <TrendingBar topics={trending} region={region} />

          {/* Social Pulse */}
          <SocialPulse posts={socialPosts} platforms={socialPlatforms} />

          {/* Error */}
          {error && (
            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-xl bg-sharingan-red/5 border border-sharingan-red/20">
                <p className="text-sm text-sharingan-red font-heading">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex rounded-lg border border-mist-gray/10 bg-ink-black/40 overflow-hidden"
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
                >
                  <div className="w-28 h-24 md:w-32 md:h-28 bg-mist-gray/5 flex-shrink-0" />
                  <div className="p-2.5 flex-1 space-y-2">
                    <div className="h-2 w-16 rounded bg-mist-gray/10" />
                    <div className="h-3 w-full rounded bg-mist-gray/10" />
                    <div className="h-3 w-3/4 rounded bg-mist-gray/10" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* News Grid — compact cards */}
          {!loading && !error && articles.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {articles.map((article, i) => (
                <NewsCard
                  key={`${article.url}-${i}`}
                  article={article}
                  index={i}
                  userLang={lang}
                  onVoiceRead={handleVoiceRead}
                />
              ))}
            </motion.div>
          )}

          {/* Empty */}
          {!loading && !error && articles.length === 0 && (
            <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-mist-gray font-heading text-lg">No articles found for this combination.</p>
              <p className="text-mist-gray/60 text-sm mt-2">Try a different country, language, or category.</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Naruto Chatbot Assistant */}
      <NarutoChatbot
        lang={lang}
        onSpeak={(fn) => { speakRef.current = fn; }}
      />

      <Footer />
    </>
  );
}
