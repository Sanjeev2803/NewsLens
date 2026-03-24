"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { timeAgo } from "@/lib/utils";
import type { Article } from "@/types/news";
import SharinganEye from "./SharinganEye";
import { getArticleRank, LANGUAGES, NEWS_FALLBACK_IMAGES } from "./constants";

function ArticleReader({ article, userLang, onVoiceRead, onClose }: { article: Article; userLang: string; onVoiceRead: (text: string) => void; onClose: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [activeLang, setActiveLang] = useState("original");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const rank = getArticleRank(article.publishedAt);
  const fallbackImg = NEWS_FALLBACK_IMAGES.general;
  const imgSrc = (!imgErr && article.image) ? article.image : fallbackImg;

  // Build unique language options
  const langOptions = ["original", "en", "hi", userLang].filter((v, i, a) => a.indexOf(v) === i && v !== "original" ? v !== "en" || userLang !== "en" : true);
  const langLabels: Record<string, string> = { original: "Original", en: "English", hi: "Hindi" };
  LANGUAGES.forEach(l => { langLabels[l.code] = l.label; });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  // Fetch full article content on mount
  useEffect(() => {
    const controller = new AbortController();
    setContentLoading(true);
    fetch(`/api/article?url=${encodeURIComponent(article.url)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { setArticleContent(data.content || null); setContentLoading(false); })
      .catch((err) => { if (err.name !== "AbortError") setContentLoading(false); });
    return () => controller.abort();
  }, [article.url]);

  const handleLangSwitch = async (targetLang: string) => {
    setActiveLang(targetLang);
    if (targetLang === "original" || !articleContent) return;
    if (translations[targetLang]) return;
    setTranslating(true);
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(articleContent.slice(0, 5000))}&to=${targetLang}`);
      const data = await res.json();
      if (data.translatedText) {
        setTranslations(prev => ({ ...prev, [targetLang]: data.translatedText }));
      }
    } catch { /* silent */ }
    setTranslating(false);
  };

  const displayedContent = activeLang === "original" ? articleContent : (translations[activeLang] || articleContent);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-[#08080d]/85 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sharingan entry */}
      <motion.div className="absolute inset-0 pointer-events-none flex items-center justify-center" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.2, delay: 0.2 }}>
        <motion.div className="w-[200px] h-[200px] rounded-full border border-sharingan-red/30" initial={{ scale: 0 }} animate={{ scale: [0, 3, 5] }} transition={{ duration: 1, ease: "easeOut" }} />
      </motion.div>

      <motion.div
        className="relative z-10 w-[95vw] max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden bg-[#0a0a10] border border-white/[0.06] shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(204,0,0,0.1)]"
        initial={{ scale: 0.7, y: 60, opacity: 0, rotateX: 15 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.8, y: 40, opacity: 0, rotateX: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{ perspective: 1000 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-sharingan-red/40 hover:bg-sharingan-red/10 transition-all">
          <svg viewBox="0 0 12 12" className="w-4 h-4"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Hero image */}
          <div className="relative aspect-[2.5/1] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover object-top" onError={() => setImgErr(true)} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/40 to-transparent" />
            <div className="absolute bottom-4 left-5 flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${rank.bgColor} border ${rank.borderColor} ${rank.glow} backdrop-blur-md`}>
                <span className="text-[9px]">{rank.icon}</span>
                <span className="text-[10px] font-heading font-bold tracking-widest" style={{ color: rank.color }}>{rank.label}</span>
              </div>
              <span className="text-xs font-mono text-white/30">{timeAgo(article.publishedAt)}</span>
            </div>
            <div className="absolute top-4 left-4 opacity-40"><SharinganEye size={24} spin glow /></div>
          </div>

          <div className="px-6 md:px-10 py-6">
            <motion.h1 className="text-xl md:text-3xl font-heading font-bold text-white leading-tight mb-3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              {article.title}
            </motion.h1>

            <motion.div className="h-[2px] w-24 bg-gradient-to-r from-sharingan-red to-chakra-orange rounded-full mb-4" initial={{ width: 0 }} animate={{ width: 96 }} transition={{ delay: 0.3, duration: 0.5 }} />

            {/* Language toggle */}
            <motion.div className="flex flex-wrap gap-2 mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              {langOptions.map(code => (
                <button
                  key={code}
                  onClick={() => handleLangSwitch(code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading tracking-wider transition-all ${
                    activeLang === code
                      ? "bg-sharingan-red/15 border border-sharingan-red/30 text-white"
                      : "bg-white/[0.03] border border-white/[0.06] text-mist-gray/60 hover:text-white hover:border-white/[0.12]"
                  }`}
                >
                  {langLabels[code] || code.toUpperCase()}
                </button>
              ))}
              {translating && (
                <span className="flex items-center gap-1.5 text-xs text-chakra-orange/70">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <SharinganEye size={12} spin />
                  </motion.span>
                  Translating...
                </span>
              )}
            </motion.div>

            {/* Article actions */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button onClick={() => onVoiceRead(`${article.title}. ${article.description}`)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-chakra-orange/10 border border-chakra-orange/25 hover:bg-chakra-orange/20 transition-all">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-chakra-orange"><path d="M8 2L4 6H1v4h3l4 4V2z" fill="currentColor" /><path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span className="text-[10px] font-heading text-chakra-orange tracking-wider">VOICE</span>
              </button>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ml-auto">
                <span className="text-[10px] font-heading text-white/70 tracking-wider">OPEN SOURCE</span>
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-white/40"><path d="M3 9l6-6M5 3h4v4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
              </a>
            </div>

            {/* Full article content — inline, no iframe */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 md:p-6">
              {contentLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-4 rounded bg-white/[0.04]" style={{ width: `${70 + Math.random() * 30}%` }} />
                  ))}
                </div>
              ) : displayedContent ? (
                <div className="text-sm md:text-base text-mist-gray/80 leading-relaxed space-y-4">
                  {displayedContent.split("\n\n").filter(Boolean).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-mist-gray/50 text-sm mb-3">{article.description}</p>
                  <p className="text-mist-gray/30 text-xs">Full article content could not be extracted.</p>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-rasengan-blue/10 border border-rasengan-blue/25 text-xs font-heading text-rasengan-blue hover:bg-rasengan-blue/20 transition-all">
                    Read on source site
                    <svg viewBox="0 0 12 12" className="w-3 h-3"><path d="M3 9l6-6M5 3h4v4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sharingan-red/40 to-transparent" />
      </motion.div>
    </motion.div>
  );
}

export default ArticleReader;
