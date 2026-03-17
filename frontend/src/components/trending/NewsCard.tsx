"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { timeAgo } from "@/lib/utils";
import type { Article } from "@/types/news";
import SharinganEye from "./SharinganEye";
import { getArticleRank, translateUrl, chakraLevel, CATEGORY_GRADIENTS, CATEGORY_ICONS, NEWS_FALLBACK_IMAGES } from "./constants";

function NewsCard({ article, index, userLang, onVoiceRead, currentCategory, onOpenReader }: { article: Article; index: number; userLang: string; onVoiceRead: (text: string) => void; currentCategory?: string; onOpenReader?: (article: Article) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const rank = getArticleRank(article.publishedAt);
  const freshness = chakraLevel(article.publishedAt);
  const catGradient = CATEGORY_GRADIENTS[currentCategory || "general"] || CATEGORY_GRADIENTS.general;
  const catIcon = CATEGORY_ICONS[currentCategory || "general"] || "\u{1F5DE}";

  // Image with fallback chain: article image -> category stock image
  const fallbackImg = NEWS_FALLBACK_IMAGES[currentCategory || "general"] || NEWS_FALLBACK_IMAGES.general;
  const imgSrc = (!imgErr && article.image) ? article.image : fallbackImg;
  const hasRealImg = article.image && !imgErr;

  return (
    <motion.div
      className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer
        bg-[#0a0a10]/90 backdrop-blur-sm
        border border-white/[0.04]
        hover:border-sharingan-red/25
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(204,0,0,0.08)]"
      initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onOpenReader?.(article)}
    >
      {/* Image area — always shows an image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
          onError={() => setImgErr(true)}
          loading="lazy"
        />
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a10]/40 via-transparent to-transparent" />

        {/* Category icon overlay for fallback images */}
        {!hasRealImg && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl opacity-15">{catIcon}</span>
          </div>
        )}

        {/* Rank badge — Naruto mission rank */}
        <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg ${rank.bgColor} border ${rank.borderColor} backdrop-blur-sm ${rank.glow}`}>
          {rank.label === "S-RANK" && (
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rank.color }} animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
          )}
          <span className="text-[7px]">{rank.icon}</span>
          <span className="text-[8px] font-heading font-bold tracking-[0.15em]" style={{ color: rank.color }}>{rank.label}</span>
        </div>

        {/* Sharingan — appears on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="absolute top-2.5 right-2.5"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 0.7, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.4 }}
            >
              <SharinganEye size={20} spin glow />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover overlay — "Click to read" hint */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="absolute inset-0 bg-[#0a0a10]/40 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-sharingan-red/20"
                initial={{ scale: 0.8, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 10 }}
              >
                <span className="text-[10px] font-heading text-sharingan-red tracking-widest uppercase">Click to Read</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Time */}
        <div className="flex items-center justify-end mb-2">
          <span className="text-[10px] font-mono text-mist-gray/30 flex-shrink-0">
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-heading font-semibold text-white/90 leading-snug line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
          {article.title}
        </h3>

        {/* Description — expands fully on hover */}
        <p className={`text-[11px] text-mist-gray/50 leading-relaxed transition-all duration-500 ${hovered ? "line-clamp-6 text-mist-gray/70" : "line-clamp-2"}`}>
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
            onClick={(e) => { e.stopPropagation(); onVoiceRead(`${article.title}. ${article.description}`); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-chakra-orange/6 border border-chakra-orange/10 hover:bg-chakra-orange/15 hover:border-chakra-orange/25 transition-all"
            title="Naruto reads aloud"
          >
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-chakra-orange/60 group-hover:text-chakra-orange"><path d="M8 2L4 6H1v4h3l4 4V2z" fill="currentColor" /><path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            <span className="text-[8px] font-heading text-chakra-orange/60 group-hover:text-chakra-orange tracking-wider">VOICE</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(translateUrl(article.url, "en"), "_blank"); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rasengan-blue/6 border border-rasengan-blue/10 hover:bg-rasengan-blue/15 hover:border-rasengan-blue/25 transition-all"
          >
            <span className="text-[8px] font-heading text-rasengan-blue/60 tracking-wider">TRANSLATE</span>
          </button>
        </div>
      </div>

      {/* Bottom glow line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sharingan-red/0 to-transparent group-hover:via-sharingan-red/30 transition-all duration-700" />
    </motion.div>
  );
}

export default NewsCard;
