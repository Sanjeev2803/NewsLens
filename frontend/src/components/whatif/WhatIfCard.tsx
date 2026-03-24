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
  IconFlask,
  IconFileText,
  IconChartPie,
} from "@tabler/icons-react";
import type { Scenario } from "@/lib/whatif/types";
import { CONTENT_TYPE_LABELS } from "@/lib/whatif/types";

// Category color palettes
const CATEGORY_CONFIG: Record<string, { gradient: string; accent: string; colors: string[] }> = {
  politics: {
    gradient: "from-rose-950/90 via-red-900/70 to-amber-950/50",
    accent: "#E63946",
    colors: ["#E63946", "#FF6B6B", "#C0392B", "#FF8A80", "#D32F2F"],
  },
  economy: {
    gradient: "from-amber-950/90 via-orange-900/70 to-yellow-950/50",
    accent: "#FF6B00",
    colors: ["#FF6B00", "#FFB347", "#E65100", "#FFCC80", "#F57C00"],
  },
  tech: {
    gradient: "from-sky-950/90 via-cyan-900/70 to-indigo-950/50",
    accent: "#00B4D8",
    colors: ["#00B4D8", "#48CAE4", "#0077B6", "#90E0EF", "#023E8A"],
  },
  sports: {
    gradient: "from-orange-950/90 via-amber-900/70 to-red-950/50",
    accent: "#FF8C00",
    colors: ["#FF8C00", "#FFA940", "#E65100", "#FFD180", "#FF6D00"],
  },
  entertainment: {
    gradient: "from-fuchsia-950/90 via-purple-900/70 to-pink-950/50",
    accent: "#7B2FBE",
    colors: ["#7B2FBE", "#AB47BC", "#6A1B9A", "#CE93D8", "#9C27B0"],
  },
  society: {
    gradient: "from-emerald-950/90 via-teal-900/70 to-green-950/50",
    accent: "#2DC653",
    colors: ["#2DC653", "#66BB6A", "#1B5E20", "#A5D6A7", "#388E3C"],
  },
  general: {
    gradient: "from-slate-900/90 via-zinc-800/70 to-gray-950/50",
    accent: "#94A3B8",
    colors: ["#94A3B8", "#78909C", "#546E7A", "#B0BEC5", "#607D8B"],
  },
};

const CONTENT_ICONS: Record<string, typeof IconFileText> = {
  article: IconFileText,
  analysis: IconChartBar,
  case_study: IconFlask,
  prediction: IconChartPie,
};

// ── Procedural illustration engine ──

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rand(seed: number, i: number): number {
  const x = Math.sin(seed + i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/*
  Procedural SVG illustration — unique colorful graphic per card.
  Geometric shapes, flowing waves, glowing orbs, floating particles.
  Every card looks different based on title hash.
*/
function CardIllustration({ category, title }: { category: string; title: string }) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;
  const h = hash(title);
  const c = config.colors;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`g${h}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={c[0]} stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Central glow */}
        <rect width="400" height="250" fill={`url(#g${h})`} />

        {/* Large background shapes */}
        <circle cx={80 + (h % 240)} cy={50 + (h % 100)} r={60 + (h % 40)} fill={c[0]} opacity="0.15" />
        <circle cx={300 - (h % 150)} cy={150 + (h % 60)} r={40 + (h % 30)} fill={c[1]} opacity="0.12" />

        {/* Flowing wave */}
        <path
          d={`M-10 ${180 + (h % 30)} Q${80 + (h % 60)} ${100 + (h % 80)}, 200 ${150 + (h % 50)} T410 ${120 + (h % 60)} V260 H-10 Z`}
          fill={c[0]}
          opacity="0.12"
        />
        <path
          d={`M-10 ${200 + (h % 20)} Q${160 + (h % 50)} ${160 + (h % 40)}, 300 ${180 + (h % 30)} T410 ${170 + (h % 40)} V260 H-10 Z`}
          fill={c[2]}
          opacity="0.08"
        />

        {/* Category-themed decorative shapes */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = 30 + rand(h, i) * 340;
          const y = 20 + rand(h, i + 10) * 180;
          const s = 12 + rand(h, i + 20) * 30;
          const col = c[i % c.length];
          const op = 0.15 + rand(h, i + 30) * 0.25;
          const shape = (h + i) % 4;

          if (shape === 0) return <circle key={i} cx={x} cy={y} r={s} fill={col} opacity={op} />;
          if (shape === 1) return <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.2} fill={col} opacity={op} transform={`rotate(${rand(h, i + 40) * 45}, ${x}, ${y})`} />;
          if (shape === 2) return <polygon key={i} points={`${x},${y - s} ${x + s * 0.87},${y + s * 0.5} ${x - s * 0.87},${y + s * 0.5}`} fill={col} opacity={op} />;
          return <ellipse key={i} cx={x} cy={y} rx={s * 1.2} ry={s * 0.6} fill={col} opacity={op} />;
        })}

        {/* Glowing orbs */}
        {Array.from({ length: 3 }, (_, i) => {
          const x = 60 + rand(h, i + 50) * 280;
          const y = 40 + rand(h, i + 60) * 140;
          const r = 20 + rand(h, i + 70) * 25;
          return (
            <g key={`orb${i}`}>
              <circle cx={x} cy={y} r={r} fill={c[i % c.length]} opacity="0.08" />
              <circle cx={x} cy={y} r={r * 0.5} fill="white" opacity="0.06" />
              <circle cx={x - r * 0.2} cy={y - r * 0.2} r={r * 0.15} fill="white" opacity="0.15" />
            </g>
          );
        })}

        {/* Floating sparkle particles */}
        {Array.from({ length: 12 }, (_, i) => (
          <circle
            key={`p${i}`}
            cx={rand(h, i + 80) * 400}
            cy={rand(h, i + 90) * 250}
            r={0.8 + rand(h, i + 100) * 2.5}
            fill="white"
            opacity={0.12 + rand(h, i + 110) * 0.25}
          />
        ))}

        {/* Accent lines */}
        <line
          x1={rand(h, 200) * 100} y1={rand(h, 201) * 80}
          x2={rand(h, 200) * 100 + 80 + rand(h, 202) * 120} y2={rand(h, 201) * 80 + 20 + rand(h, 203) * 40}
          stroke={c[0]} strokeWidth="1" opacity="0.15"
        />
        <line
          x1={200 + rand(h, 210) * 150} y1={100 + rand(h, 211) * 80}
          x2={200 + rand(h, 210) * 150 + 60} y2={100 + rand(h, 211) * 80 + 40}
          stroke={c[1]} strokeWidth="0.8" opacity="0.12"
        />
      </svg>

      {/* Bottom vignette for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/40 to-transparent" />
    </div>
  );
}

/*
  CoverImage: Shows AI-generated cartoon if available, falls back to SVG illustration.
*/
function CoverImage({ category, title, imageUrl }: { category: string; title: string; imageUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = imageUrl && !imgError;

  return (
    <>
      {hasImage ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {/* Bottom vignette for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/30 to-transparent" />
        </div>
      ) : (
        <CardIllustration category={category} title={title} />
      )}
    </>
  );
}

// ── Card component ──

export default function WhatIfCard({ scenario, index, featured = false }: { scenario: Scenario; index: number; featured?: boolean }) {
  const contentLabel = CONTENT_TYPE_LABELS[scenario.content_type] || CONTENT_TYPE_LABELS.article;
  const ContentIcon = CONTENT_ICONS[scenario.content_type] || IconFileText;
  const outcomes = scenario.outcomes || [];
  const totalVotes = outcomes.reduce((sum, o) => sum + o.vote_count, 0);

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={`/whatif/${scenario.id}`}>
          <div className="group relative rounded-xl overflow-hidden cursor-pointer">
            <div className="relative aspect-[16/9] sm:aspect-[2.5/1] md:aspect-[3/1]">
              <CoverImage category={scenario.category} title={scenario.title} imageUrl={scenario.cover_image} />

              <div className="absolute top-4 right-4 z-10">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-white"
                  style={{ background: contentLabel.color }}
                >
                  <ContentIcon size={11} />
                  {contentLabel.label}
                </span>
              </div>

              {scenario.is_ai_generated && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-amaterasu-purple text-[9px] font-mono">
                    <IconSparkles size={10} />
                    AI Generated
                  </span>
                </div>
              )}

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link href={`/whatif/${scenario.id}`}>
        <div className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#0c0c14] border border-white/[0.05] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20 transition-all duration-500">
          <div className="relative aspect-[16/10] overflow-hidden">
            <CoverImage category={scenario.category} title={scenario.title} imageUrl={scenario.cover_image} />

            <div className="absolute bottom-3 right-3 z-10">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest text-white"
                style={{ background: contentLabel.color }}
              >
                {contentLabel.label}
              </span>
            </div>

            {scenario.source_trend && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-white/80">
                  <IconTrendingUp size={9} className="text-sharingan-red" />
                  {scenario.source_trend.length > 20 ? scenario.source_trend.slice(0, 20) + "..." : scenario.source_trend}
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-amaterasu-purple/0 group-hover:bg-amaterasu-purple/10 transition-colors duration-300" />
          </div>

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
