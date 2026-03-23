"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  IconArrowLeft,
  IconSparkles,
  IconTrendingUp,
  IconExternalLink,
  IconClock,
  IconEye,
  IconShare2,
  IconBookmark,
  IconGitFork,
} from "@tabler/icons-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OutcomePoll from "@/components/whatif/OutcomePoll";
import type { Scenario, TimelineNode } from "@/lib/whatif/types";
import { CONTENT_TYPE_LABELS } from "@/lib/whatif/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ScenarioDetail extends Scenario {
  timeline: TimelineNode[];
  impact: { economy: number; politics: number; society: number; tech: number; count: number };
  evidence: any[];
}

const IMPACT_CONFIG = [
  { key: "economy" as const, label: "Economy", color: "#FF6B00" },
  { key: "politics" as const, label: "Politics", color: "#E63946" },
  { key: "society" as const, label: "Society", color: "#2DC653" },
  { key: "tech" as const, label: "Tech", color: "#00B4D8" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
}

// Simple markdown-ish renderer for article body
function ArticleBody({ body }: { body: string }) {
  const lines = body.split("\n");

  return (
    <div className="prose-whatif space-y-4">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // ## Heading
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-title text-xl md:text-2xl text-scroll-cream mt-8 mb-3 first:mt-0">
              {trimmed.slice(3)}
            </h2>
          );
        }

        // ### Subheading
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-lg text-scroll-cream/90 mt-6 mb-2">
              {trimmed.slice(4)}
            </h3>
          );
        }

        // Table row
        if (trimmed.startsWith("|")) {
          if (trimmed.includes("---")) return null; // separator
          const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
          return (
            <div key={i} className="flex gap-4 py-1.5 text-xs font-mono border-b border-white/[0.04]">
              {cells.map((cell, j) => (
                <span key={j} className={`flex-1 ${j === 0 ? "text-scroll-cream/80" : "text-mist-gray/60"}`}>
                  {cell}
                </span>
              ))}
            </div>
          );
        }

        // List item
        if (trimmed.startsWith("- ")) {
          const text = trimmed.slice(2);
          return (
            <div key={i} className="flex items-start gap-2.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amaterasu-purple/60 mt-2 shrink-0" />
              <span className="text-mist-gray/70 font-body text-[15px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatInline(text) }}
              />
            </div>
          );
        }

        // Italic paragraph (*text*)
        if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
          return (
            <p key={i} className="text-amaterasu-purple/70 font-body text-sm italic border-l-2 border-amaterasu-purple/30 pl-4 my-6">
              {trimmed.slice(1, -1)}
            </p>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-mist-gray/70 font-body text-[15px] leading-[1.8]"
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-scroll-cream/90 font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/whatif/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setScenario)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-amaterasu-purple/20 border-t-amaterasu-purple animate-spin" />
        </main>
      </>
    );
  }

  if (error || !scenario) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 px-6 text-center py-20">
          <h1 className="font-brand text-2xl text-scroll-cream/60 mb-3">Not Found</h1>
          <p className="text-mist-gray/30 font-mono text-xs">This scenario doesn't exist</p>
        </main>
        <Footer />
      </>
    );
  }

  const contentLabel = CONTENT_TYPE_LABELS[scenario.content_type] || CONTENT_TYPE_LABELS.article;
  const outcomes = scenario.outcomes || [];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20">
        {/* Article header — full width */}
        <div className="px-4 md:px-6">
          <div className="max-w-4xl mx-auto pt-4">
            {/* Back */}
            <Link
              href="/whatif"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-mist-gray/40 hover:text-amaterasu-purple transition-colors mb-6"
            >
              <IconArrowLeft size={13} />
              Back to What-If Dimension
            </Link>

            {/* Badges */}
            <motion.div
              className="flex flex-wrap items-center gap-2 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-white"
                style={{ background: contentLabel.color }}
              >
                {contentLabel.label}
              </span>

              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] font-mono uppercase tracking-wider text-mist-gray/60">
                {scenario.category}
              </span>

              {scenario.is_ai_generated && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amaterasu-purple/60">
                  <IconSparkles size={10} />
                  AI Generated
                </span>
              )}

              {scenario.source_trend && (
                <a
                  href={scenario.source_trend_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-mono text-sharingan-red/60 hover:text-sharingan-red transition-colors"
                >
                  <IconTrendingUp size={10} />
                  {scenario.source_trend}
                  <IconExternalLink size={8} />
                </a>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-title text-2xl md:text-4xl lg:text-5xl text-scroll-cream leading-[1.1] mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {scenario.title}
            </motion.h1>

            {/* Description */}
            {scenario.description && (
              <motion.p
                className="text-mist-gray/50 font-body text-base md:text-lg mb-6 max-w-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {scenario.description}
              </motion.p>
            )}

            {/* Meta bar */}
            <motion.div
              className="flex items-center justify-between py-4 border-y border-white/[0.04] mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-4 text-[11px] font-mono text-mist-gray/40">
                <span>
                  {scenario.is_ai_generated ? "NewsLens AI" : scenario.profile?.display_name || "Anonymous"}
                </span>
                <span className="flex items-center gap-1">
                  <IconClock size={11} />
                  {timeAgo(scenario.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <IconEye size={11} />
                  {scenario.read_time || 3} min read
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-2 rounded-md text-mist-gray/30 hover:text-amaterasu-purple hover:bg-amaterasu-purple/5 transition-all">
                  <IconBookmark size={15} />
                </button>
                <button className="p-2 rounded-md text-mist-gray/30 hover:text-rasengan-blue hover:bg-rasengan-blue/5 transition-all">
                  <IconShare2 size={15} />
                </button>
                <button className="p-2 rounded-md text-mist-gray/30 hover:text-chakra-orange hover:bg-chakra-orange/5 transition-all">
                  <IconGitFork size={15} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Article body */}
        <div className="px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {scenario.body ? (
                <ArticleBody body={scenario.body} />
              ) : (
                <p className="text-mist-gray/50 font-body text-center py-10">
                  No article content yet.
                </p>
              )}
            </motion.div>

            {/* ── Prediction Poll — embedded in article ── */}
            {outcomes.length > 0 && (
              <motion.div
                className="my-10"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <OutcomePoll outcomes={outcomes} readonly={true} />
              </motion.div>
            )}

            {/* ── Impact Assessment ── */}
            {scenario.impact.count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="my-10 rounded-xl border border-white/[0.04] bg-[#0c0c14] p-6"
              >
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-scroll-cream/80 mb-4">
                  Community Impact Assessment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {IMPACT_CONFIG.map(({ key, label, color }) => (
                    <div key={key} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                          <motion.circle
                            cx="18" cy="18" r="16" fill="none"
                            stroke={color} strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={`${(scenario.impact[key] / 10) * 100.5} 100.5`}
                            initial={{ strokeDasharray: "0 100.5" }}
                            animate={{ strokeDasharray: `${(scenario.impact[key] / 10) * 100.5} 100.5` }}
                            transition={{ duration: 1 }}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold" style={{ color }}>
                          {scenario.impact[key]}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-mist-gray/40">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Timeline ── */}
            {scenario.timeline && scenario.timeline.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="my-10 rounded-xl border border-white/[0.04] bg-[#0c0c14] p-6"
              >
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-scroll-cream/80 mb-5">
                  Event Timeline
                </h3>
                <div className="space-y-0 pl-3">
                  {scenario.timeline.map((node, i) => {
                    const probColor = node.probability > 70 ? "#2DC653" : node.probability > 40 ? "#FF6B00" : "#E63946";
                    return (
                      <div key={node.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: probColor, background: `${probColor}33` }} />
                          {i < scenario.timeline.length - 1 && <div className="w-px flex-1 bg-white/[0.06]" />}
                        </div>
                        <div className="pb-5">
                          <p className="text-sm font-heading text-scroll-cream/80">{node.label}</p>
                          {node.description && <p className="text-[11px] text-mist-gray/40 mt-0.5">{node.description}</p>}
                          <span className="text-[9px] font-mono" style={{ color: probColor }}>{node.probability}% probability</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
