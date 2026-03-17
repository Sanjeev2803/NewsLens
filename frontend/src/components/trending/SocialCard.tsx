"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SocialPost } from "@/types/news";
import { PLAT, NEWS_FALLBACK_IMAGES, formatTimeSpecific } from "./constants";

function SocialCard({ post, index, currentCategory, time }: { post: SocialPost; index: number; currentCategory: string; time: Date }) {
  const [imgErr, setImgErr] = useState(false);
  const s = PLAT[post.platform] || PLAT.reddit;
  const fallbackImg = NEWS_FALLBACK_IMAGES[currentCategory || "general"] || NEWS_FALLBACK_IMAGES.general;
  const hasImg = post.image && !imgErr;

  return (
    <motion.a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-xl overflow-hidden bg-[#0a0a10]/90 backdrop-blur-sm border border-white/[0.04] hover:border-sharingan-red/25 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(204,0,0,0.08)]"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
    >
      {/* Image area — shows full image without cropping faces */}
      <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0a10]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hasImg ? post.image! : fallbackImg}
          alt=""
          className={`absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-700 ${
            post.platform === "wikipedia" ? "object-contain" : "object-cover object-top"
          }`}
          loading="lazy"
          onError={() => setImgErr(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-transparent to-transparent opacity-90" />
        {!hasImg && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
              {s.icon}
            </div>
          </div>
        )}
        {/* Platform badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm" style={{ backgroundColor: `${s.color}20`, border: `1px solid ${s.color}30` }}>
          <span className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: s.color }}>{s.icon}</span>
          <span className="text-[9px] font-heading font-semibold" style={{ color: s.color }}>
            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
          </span>
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-[13px] font-heading font-semibold text-white/90 leading-snug line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
          {post.title}
        </h3>
        {post.text && post.text !== post.title && (
          <p className="text-[11px] text-mist-gray/50 leading-relaxed line-clamp-2 mb-2">{post.text}</p>
        )}
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-[9px] font-mono text-mist-gray/40 truncate">{post.author}</span>
          {post.score > 0 && (
            <span className="text-[9px] font-mono" style={{ color: s.color }}>
              {post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
            </span>
          )}
          <span className="text-[10px] font-mono text-mist-gray/30 ml-auto">{formatTimeSpecific(time)}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sharingan-red/0 to-transparent group-hover:via-sharingan-red/30 transition-all duration-700" />
    </motion.a>
  );
}

export default SocialCard;
