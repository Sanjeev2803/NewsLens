"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@tabler/icons-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import OutcomePoll from "@/components/whatif/OutcomePoll";
import Comments from "@/components/whatif/Comments";
import type { Scenario, Outcome, TimelineNode } from "@/lib/whatif/types";
import { CONTENT_TYPE_LABELS } from "@/lib/whatif/types";
import { timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

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

// ── Reading progress bar ──────────────────────────────────────────────────────

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px]">
      <div
        className="h-full bg-amaterasu-purple transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Article body renderer — Medium-quality typography ──────────────────────────

function ArticleBody({ body }: { body: string }) {
  const lines = body.split("\n");
  let sectionCount = 0;
  let paragraphCount = 0;

  return (
    <article className="space-y-6">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (/^<!--\s*IMG:/.test(trimmed)) return null;

        // ## Section heading
        if (trimmed.startsWith("## ")) {
          const headingText = trimmed.slice(3);
          sectionCount++;
          return (
            <div key={i}>
              {sectionCount > 1 && (
                <div className="mt-12 mb-6 h-px bg-white/[0.06]" />
              )}
              <h2 className="font-title text-2xl md:text-3xl text-scroll-cream mb-4 leading-snug">
                {headingText}
              </h2>
            </div>
          );
        }

        // ### Subheading
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="font-heading text-xl text-scroll-cream/90 mt-8 mb-3">
              {trimmed.slice(4)}
            </h3>
          );
        }

        // Table
        if (trimmed.startsWith("|")) {
          if (trimmed.includes("---")) return null;
          const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
          const isHeader = i + 1 < lines.length && lines[i + 1]?.includes("---");
          return (
            <div key={i}
              className={`flex gap-4 py-2.5 px-4 text-sm ${isHeader
                ? "border-b-2 border-white/[0.08] text-scroll-cream/90 font-semibold"
                : "border-b border-white/[0.04]"
              }`}
            >
              {cells.map((cell, j) => (
                <span key={j} className={`flex-1 ${j === 0 ? "text-scroll-cream/85" : "text-scroll-cream/70"}`}>
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
            <div key={i} className="flex items-start gap-3 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amaterasu-purple/30 mt-[10px] shrink-0" />
              <span className="text-scroll-cream/85 font-body text-[17px] md:text-[19px] leading-[1.9]"
                dangerouslySetInnerHTML={{ __html: formatInline(text) }}
              />
            </div>
          );
        }

        // Blockquote / italic callout
        if (trimmed.startsWith("*") && trimmed.endsWith("*") && !trimmed.startsWith("**")) {
          return (
            <blockquote key={i} className="my-10 pl-6 border-l-[3px] border-amaterasu-purple/25">
              <p className="text-scroll-cream/65 font-body text-base md:text-lg italic leading-relaxed">
                {trimmed.slice(1, -1)}
              </p>
            </blockquote>
          );
        }

        // Regular paragraph
        paragraphCount++;
        const isLead = paragraphCount === 1;
        return (
          <p key={i}
            className={`font-body leading-[1.9] md:leading-[2] ${
              isLead
                ? "text-scroll-cream/90 text-[19px] md:text-[21px]"
                : "text-scroll-cream/85 text-[17px] md:text-[19px]"
            }`}
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      })}
    </article>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-scroll-cream font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScenarioDetailClient() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);

  // Voting state
  const [votedOutcomeId, setVotedOutcomeId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [liveOutcomes, setLiveOutcomes] = useState<Outcome[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/whatif/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        setScenario(data);
        setLiveOutcomes(data.outcomes || []);
        // Check localStorage for existing vote
        const stored = localStorage.getItem(`whatif-vote-${id}`);
        if (stored) setVotedOutcomeId(stored);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = useCallback(async (outcomeId: string) => {
    if (!id || voting || votedOutcomeId) return;
    setVoting(true);

    try {
      const res = await fetch(`/api/whatif/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome_id: outcomeId }),
      });

      if (res.status === 409) {
        // Already voted (by IP) — just mark it
        const data = await res.json();
        setVotedOutcomeId(data.voted_outcome_id || outcomeId);
        localStorage.setItem(`whatif-vote-${id}`, data.voted_outcome_id || outcomeId);
        toast("Vote recorded", "success");
        return;
      }

      if (!res.ok) throw new Error("Vote failed");

      const data = await res.json();
      setVotedOutcomeId(outcomeId);
      localStorage.setItem(`whatif-vote-${id}`, outcomeId);
      if (data.outcomes) setLiveOutcomes(data.outcomes);
      toast("Vote recorded", "success");
    } catch {
      toast("Failed to vote", "error");
    } finally {
      setVoting(false);
    }
  }, [id, voting, votedOutcomeId]);

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
          <p className="text-mist-gray/30 font-mono text-xs">This scenario doesn&apos;t exist</p>
        </main>
        <Footer />
      </>
    );
  }

  const contentLabel = CONTENT_TYPE_LABELS[scenario.content_type] || CONTENT_TYPE_LABELS.article;
  const outcomes = liveOutcomes.length > 0 ? liveOutcomes : (scenario.outcomes || []);

  return (
    <>
      <ReadingProgress />
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20">
        {/* Article header */}
        <div className="px-4 md:px-6">
          <div className="max-w-4xl mx-auto pt-4">
            {/* Back */}
            <Link
              href="/whatif"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-mist-gray/55 hover:text-amaterasu-purple transition-colors mb-8"
            >
              <IconArrowLeft size={13} />
              Back to What-If
            </Link>

            {/* Badges */}
            <motion.div
              className="flex flex-wrap items-center gap-2 mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span
                className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-white"
                style={{ background: contentLabel.color }}
              >
                {contentLabel.label}
              </span>

              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] font-mono uppercase tracking-wider text-mist-gray/75">
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
              className="font-title text-3xl md:text-4xl lg:text-5xl text-scroll-cream leading-tight mb-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {scenario.title}
            </motion.h1>

            {/* Description */}
            {scenario.description && (
              <motion.p
                className="text-scroll-cream/60 font-body text-lg md:text-xl leading-relaxed mb-8 max-w-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {scenario.description}
              </motion.p>
            )}

            {/* Meta bar */}
            <motion.div
              className="flex items-center justify-between py-4 border-y border-white/[0.06] mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-5 text-xs font-mono text-mist-gray/70">
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

              <div className="flex items-center gap-1 relative">
                <button
                  onClick={() => setBookmarked((b) => !b)}
                  className={`p-2 rounded-md transition-all ${bookmarked ? "text-amaterasu-purple bg-amaterasu-purple/10" : "text-mist-gray/30 hover:text-amaterasu-purple hover:bg-amaterasu-purple/5"}`}
                  title={bookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  <IconBookmark size={15} />
                </button>
                <button
                  onClick={() => {
                    try { navigator.clipboard.writeText(window.location.href); } catch { /* noop */ }
                    setShareToast(true);
                    setTimeout(() => setShareToast(false), 2000);
                  }}
                  className="p-2 rounded-md text-mist-gray/30 hover:text-rasengan-blue hover:bg-rasengan-blue/5 transition-all"
                  title="Copy link"
                >
                  <IconShare2 size={15} />
                </button>
                {shareToast && (
                  <span className="absolute -bottom-7 right-0 text-[10px] font-mono text-rasengan-blue bg-rasengan-blue/10 px-2 py-0.5 rounded">
                    Link copied!
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Cover image — hidden entirely if URL is broken/expired */}
        {scenario.cover_image && !coverImgError && (
          <div className="px-4 md:px-6">
            <div className="max-w-4xl mx-auto mb-10">
              <div className="rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scenario.cover_image}
                  alt={scenario.title}
                  className="w-full h-auto"
                  loading="eager"
                  style={{ aspectRatio: "16/9", objectFit: "cover" }}
                  onError={() => setCoverImgError(true)}
                />
              </div>
            </div>
          </div>
        )}

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
                <p className="text-mist-gray/65 font-body text-center py-10">
                  No article content yet.
                </p>
              )}
            </motion.div>

            {/* Prediction Poll */}
            {outcomes.length > 0 && (
              <motion.div
                className="my-12"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <OutcomePoll
                  outcomes={outcomes}
                  votedOutcomeId={votedOutcomeId}
                  onVote={handleVote}
                  voting={voting}
                />
              </motion.div>
            )}

            {/* Impact Assessment */}
            {scenario.impact.count > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="my-12 rounded-xl border border-white/[0.04] bg-[#0c0c14] p-6"
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
                      <span className="text-[10px] font-mono uppercase tracking-wider text-mist-gray/55">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Timeline */}
            {scenario.timeline && scenario.timeline.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="my-12 rounded-xl border border-white/[0.04] bg-[#0c0c14] p-6"
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
                          {node.description && <p className="text-[11px] text-mist-gray/55 mt-0.5">{node.description}</p>}
                          <span className="text-[9px] font-mono" style={{ color: probColor }}>{node.probability}% probability</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Comments */}
            <motion.div
              className="my-12"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Comments scenarioId={scenario.id} category={scenario.category} />
            </motion.div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-16" />
      </main>
      <Footer />
    </>
  );
}
