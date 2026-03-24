"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import {
  IconSparkles,
  IconTrendingUp,
  IconClock,
  IconEye,
  IconChartBar,
  IconBookmark,
  IconFlask,
  IconFileText,
  IconChartPie,
} from "@tabler/icons-react";
import type { Scenario } from "@/lib/whatif/types";
import { CONTENT_TYPE_LABELS } from "@/lib/whatif/types";

const CATEGORY_CONFIG: Record<string, { gradient: string; icon: string; pattern: string }> = {
  politics: {
    gradient: "from-red-900/80 via-red-800/60 to-orange-900/40",
    icon: "shield",
    pattern: "polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)",
  },
  economy: {
    gradient: "from-amber-900/80 via-orange-800/60 to-yellow-900/40",
    icon: "chart",
    pattern: "polygon(0 0, 100% 0, 100% 85%, 70% 100%, 0 100%)",
  },
  tech: {
    gradient: "from-cyan-900/80 via-blue-800/60 to-indigo-900/40",
    icon: "cpu",
    pattern: "polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 80%)",
  },
  sports: {
    gradient: "from-orange-900/80 via-amber-800/60 to-red-900/40",
    icon: "trophy",
    pattern: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  },
  entertainment: {
    gradient: "from-pink-900/80 via-purple-800/60 to-fuchsia-900/40",
    icon: "star",
    pattern: "polygon(0 0, 100% 0, 100% 90%, 50% 100%, 0 90%)",
  },
  society: {
    gradient: "from-emerald-900/80 via-green-800/60 to-teal-900/40",
    icon: "heart",
    pattern: "polygon(0 0, 100% 0, 100% 100%, 0 85%)",
  },
  general: {
    gradient: "from-slate-800/80 via-gray-800/60 to-zinc-900/40",
    icon: "globe",
    pattern: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  },
};

const CONTENT_ICONS: Record<string, typeof IconFileText> = {
  article: IconFileText,
  analysis: IconChartBar,
  case_study: IconFlask,
  prediction: IconChartPie,
};

/*
  Cover art: Real scraped image with Ghibli/illustrated CSS filter treatment.
  Falls back to category gradient + pattern when no image available.
*/
function CoverArt({ category, title, imageUrl }: { category: string; title: string; imageUrl?: string | null }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
  const [imgError, setImgError] = useState(false);
  const hasImage = imageUrl && !imgError;

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}>
      {/* Real image with artistic filter */}
      {hasImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: "saturate(1.6) contrast(1.15) brightness(0.85) sepia(0.15)",
            }}
            onError={() => setImgError(true)}
          />
          {/* Dreamy color overlay — category-tinted */}
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-50"
            style={{ background: `linear-gradient(135deg, ${config.gradient.includes("cyan") ? "#00B4D8" : config.gradient.includes("red") ? "#E63946" : config.gradient.includes("amber") ? "#FF6B00" : config.gradient.includes("emerald") ? "#2DC653" : "#7B2FBE"}44, transparent)` }}
          />
          {/* Slight noise grain for illustrated feel */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />
        </>
      )}

      {/* Fallback: geometric pattern when no image */}
      {!hasImage && (
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 400 250">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 35} x2="400" y2={i * 35} stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 35} y1="0" x2={i * 35} y2="250" stroke="white" strokeWidth="0.5" />
          ))}
        </svg>
      )}

      {/* Vignette gradient — always present */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080d]/50 via-transparent to-[#08080d]/30" />
    </div>
  );
}


export default function WhatIfCard({ scenario, index, featured = false }: { scenario: Scenario; index: number; featured?: boolean }) {
  const contentLabel = CONTENT_TYPE_LABELS[scenario.content_type] || CONTENT_TYPE_LABELS.article;
  const ContentIcon = CONTENT_ICONS[scenario.content_type] || IconFileText;
  const outcomes = scenario.outcomes || [];
  const totalVotes = outcomes.reduce((sum, o) => sum + o.vote_count, 0);

  if (featured) {
    // ── Featured card: Large, horizontal, like Cointelegraph hero ──
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={`/whatif/${scenario.id}`}>
          <div className="group relative rounded-xl overflow-hidden cursor-pointer">
            {/* Cover art — tall */}
            <div className="relative aspect-[2.5/1] md:aspect-[3/1]">
              <CoverArt category={scenario.category} title={scenario.title} imageUrl={scenario.cover_image} />

              {/* Content type badge */}
              <div className="absolute top-4 right-4 z-10">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-white"
                  style={{ background: contentLabel.color }}
                >
                  <ContentIcon size={11} />
                  {contentLabel.label}
                </span>
              </div>

              {/* AI badge */}
              {scenario.is_ai_generated && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-amaterasu-purple text-[9px] font-mono">
                    <IconSparkles size={10} />
                    AI Generated
                  </span>
                </div>
              )}

              {/* Bottom content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 z-10">
                {scenario.source_trend && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <IconTrendingUp size={11} className="text-sharingan-red" />
                    <span className="text-[10px] font-mono text-sharingan-red/80">
                      Trending: {scenario.source_trend}
                    </span>
                  </div>
                )}

                <h2 className="font-title text-xl md:text-2xl lg:text-3xl text-white leading-tight mb-2 group-hover:text-amaterasu-purple transition-colors">
                  {scenario.title}
                </h2>

                {scenario.description && (
                  <p className="text-sm text-white/60 font-body line-clamp-2 max-w-2xl mb-3">
                    {scenario.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
                  <span className="flex items-center gap-1">
                    <IconClock size={10} />
                    {timeAgo(scenario.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconEye size={10} />
                    {scenario.read_time || 3} min read
                  </span>
                  {totalVotes > 0 && (
                    <span className="flex items-center gap-1">
                      <IconChartBar size={10} />
                      {totalVotes} predictions
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // ── Standard card: Cointelegraph style with cover image ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/whatif/${scenario.id}`}>
        <div className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#0c0c14] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
          {/* Cover image area */}
          <div className="relative aspect-[3/2] overflow-hidden">
            <CoverArt category={scenario.category} title={scenario.title} imageUrl={scenario.cover_image} />

            {/* Content type badge */}
            <div className="absolute bottom-3 right-3 z-10">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest text-white"
                style={{ background: contentLabel.color }}
              >
                {contentLabel.label}
              </span>
            </div>

            {/* Trending badge */}
            {scenario.source_trend && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-white/80">
                  <IconTrendingUp size={9} className="text-sharingan-red" />
                  {scenario.source_trend.length > 20 ? scenario.source_trend.slice(0, 20) + "..." : scenario.source_trend}
                </span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-amaterasu-purple/0 group-hover:bg-amaterasu-purple/10 transition-colors duration-300" />
          </div>

          {/* Text content */}
          <div className="p-4">
            <h3 className="font-title text-sm md:text-base text-scroll-cream leading-snug line-clamp-2 group-hover:text-amaterasu-purple transition-colors mb-2">
              {scenario.title}
            </h3>

            <div className="flex items-center justify-between text-[10px] font-mono text-mist-gray/40">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  {scenario.is_ai_generated ? (
                    <>
                      <IconSparkles size={9} className="text-amaterasu-purple" />
                      NewsLens AI
                    </>
                  ) : (
                    scenario.profile?.display_name || "Anonymous"
                  )}
                </span>
                <span>{timeAgo(scenario.created_at)}</span>
              </div>
              <span className="flex items-center gap-1">
                <IconEye size={9} />
                {scenario.read_time || 3} min
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
