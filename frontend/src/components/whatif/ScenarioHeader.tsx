"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  IconArrowLeft,
  IconSparkles,
  IconTrendingUp,
  IconGitFork,
  IconExternalLink,
  IconShare2,
  IconCopy,
} from "@tabler/icons-react";
import type { Scenario } from "@/lib/whatif/types";

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  politics: { color: "#E63946", bg: "rgba(230,57,70,0.12)" },
  economy: { color: "#FF6B00", bg: "rgba(255,107,0,0.12)" },
  tech: { color: "#00B4D8", bg: "rgba(0,180,216,0.12)" },
  society: { color: "#2DC653", bg: "rgba(45,198,83,0.12)" },
  sports: { color: "#F4A261", bg: "rgba(244,162,97,0.12)" },
  entertainment: { color: "#E76F51", bg: "rgba(231,111,81,0.12)" },
  general: { color: "#8B8BA3", bg: "rgba(139,139,163,0.12)" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ScenarioHeader({ scenario }: { scenario: Scenario }) {
  const cat = CATEGORY_CONFIG[scenario.category] || CATEGORY_CONFIG.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {/* Back */}
      <Link
        href="/whatif"
        className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-mist-gray/40 hover:text-amaterasu-purple transition-colors mb-5"
      >
        <IconArrowLeft size={13} />
        Back to predictions
      </Link>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className="px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
          style={{ color: cat.color, background: cat.bg }}
        >
          {scenario.category}
        </span>

        {scenario.is_ai_generated && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amaterasu-purple/10 text-amaterasu-purple text-[9px] font-mono uppercase tracking-wider">
            <IconSparkles size={10} />
            AI Generated
          </span>
        )}

        {scenario.source_trend && (
          <a
            href={scenario.source_trend_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-sharingan-red/10 text-sharingan-red text-[9px] font-mono hover:bg-sharingan-red/20 transition-colors"
          >
            <IconTrendingUp size={10} />
            {scenario.source_trend}
            <IconExternalLink size={9} className="opacity-50" />
          </a>
        )}

        <span className="text-[10px] text-mist-gray/30 font-mono ml-auto">
          {timeAgo(scenario.created_at)}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-title text-2xl md:text-3xl lg:text-4xl text-scroll-cream leading-tight mb-3">
        {scenario.title}
      </h1>

      {/* Description */}
      {scenario.description && (
        <p className="text-mist-gray/60 font-body text-sm md:text-base leading-relaxed mb-5 max-w-3xl">
          {scenario.description}
        </p>
      )}

      {/* Author + actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
        <div className="text-[10px] text-mist-gray/40 font-mono uppercase tracking-wider">
          {scenario.profile?.display_name
            ? `By ${scenario.profile.display_name}`
            : scenario.is_ai_generated
            ? "NewsLens AI"
            : "Anonymous"}
        </div>

        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-mist-gray/40 hover:text-amaterasu-purple hover:bg-amaterasu-purple/5 transition-all">
            <IconGitFork size={12} />
            Fork
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-mist-gray/40 hover:text-rasengan-blue hover:bg-rasengan-blue/5 transition-all">
            <IconCopy size={12} />
            Copy Link
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-mist-gray/40 hover:text-chakra-orange hover:bg-chakra-orange/5 transition-all">
            <IconShare2 size={12} />
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}
