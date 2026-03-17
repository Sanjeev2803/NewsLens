"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { timeAgo } from "@/lib/utils";
import type { Article } from "@/types/news";
import SharinganEye from "./SharinganEye";
import { getArticleRank, translateUrl, CATEGORY_GRADIENTS, CATEGORY_ICONS, NEWS_FALLBACK_IMAGES } from "./constants";

function FeaturedCard({ article, userLang, onVoiceRead, currentCategory, onOpenReader }: { article: Article; userLang: string; onVoiceRead: (text: string) => void; currentCategory?: string; onOpenReader?: (article: Article) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const rank = getArticleRank(article.publishedAt);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [3, -3]);
  const rotateY = useTransform(mouseX, [0, 1], [-3, 3]);
  const catGradient = CATEGORY_GRADIENTS[currentCategory || "general"] || CATEGORY_GRADIENTS.general;
  const catIcon = CATEGORY_ICONS[currentCategory || "general"] || "\u{1F5DE}";
  const fallbackImg = NEWS_FALLBACK_IMAGES[currentCategory || "general"] || NEWS_FALLBACK_IMAGES.general;
  const imgSrc = (!imgErr && article.image) ? article.image : fallbackImg;
  const hasRealImg = article.image && !imgErr;

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
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Background Image — always visible */}
      <div className="relative aspect-[2.2/1] md:aspect-[3/1] cursor-pointer" onClick={() => onOpenReader?.(article)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={() => setImgErr(true)}
        />
        {/* Heavy dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080d]/80 via-transparent to-[#08080d]/60" />
        {/* Category icon for fallback images */}
        {!hasRealImg && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-7xl opacity-10">{catIcon}</span>
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
          {/* Rank badge — Naruto mission rank */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${rank.bgColor} border ${rank.borderColor} ${rank.glow} backdrop-blur-sm`}>
              {rank.label === "S-RANK" && (
                <motion.div className="w-2 h-2 rounded-full" style={{ backgroundColor: rank.color }} animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              )}
              <span className="text-[9px]">{rank.icon}</span>
              <span className="text-[10px] font-heading font-bold tracking-widest" style={{ color: rank.color }}>{rank.label}</span>
              <span className="text-[8px] font-mono tracking-wider opacity-60" style={{ color: rank.color }}>{rank.sub}</span>
            </div>
            <span className="text-[11px] font-mono text-mist-gray/30">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* Title — click opens reader */}
          <button onClick={() => onOpenReader?.(article)} className="text-left">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
              {article.title}
            </h2>
          </button>

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
            <button
              onClick={() => window.open(translateUrl(article.url, "en"), "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rasengan-blue/10 border border-rasengan-blue/20 hover:bg-rasengan-blue/20 transition-all"
            >
              <span className="text-[10px] font-heading text-rasengan-blue tracking-wider">TRANSLATE</span>
            </button>
            <button onClick={() => onOpenReader?.(article)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all ml-auto">
              <span className="text-[10px] font-heading text-white/70 tracking-wider">READ FULL</span>
              <svg viewBox="0 0 12 12" className="w-3 h-3 text-white/50"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default FeaturedCard;
