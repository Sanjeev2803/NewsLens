"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SocialPost } from "@/types/news";
import SharinganEye from "./SharinganEye";
import { PLAT } from "./constants";

function SocialPulse({ posts, platforms }: { posts: SocialPost[]; platforms: string[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({});
  const total = Math.min(posts.length, 12);

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => setActive((p) => (p + 1) % total), 5000);
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
              {/* Image — left side on desktop, top on mobile */}
              <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[220px] overflow-hidden flex-shrink-0">
                {hasImg ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image!}
                      alt=""
                      className={`absolute inset-0 w-full h-full bg-[#0a0a10] group-hover:scale-105 transition-transform duration-500 ${
                        post.platform === "wikipedia" ? "object-contain p-1" : "object-cover object-top"
                      }`}
                      loading="lazy"
                      onError={() => setImgErr((prev) => ({ ...prev, [active]: true }))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10]/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0a0a10]/80" />
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

              {/* Content — right side on desktop, below on mobile */}
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
              transition={paused ? {} : { duration: 5, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SocialPulse;
