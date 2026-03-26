"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { IconChartBar, IconArrowUp, IconCheck, IconLoader2 } from "@tabler/icons-react";
import Link from "next/link";
import type { Outcome } from "@/lib/whatif/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";

const OUTCOME_COLORS = [
  { bar: "#7B2FBE", glow: "rgba(123,47,190,0.15)", text: "#a855f7" },
  { bar: "#E63946", glow: "rgba(230,57,70,0.15)", text: "#f87171" },
  { bar: "#00B4D8", glow: "rgba(0,180,216,0.15)", text: "#22d3ee" },
  { bar: "#FF6B00", glow: "rgba(255,107,0,0.15)", text: "#fb923c" },
  { bar: "#2DC653", glow: "rgba(45,198,83,0.15)", text: "#4ade80" },
];

interface OutcomePollProps {
  outcomes: Outcome[];
  votedOutcomeId?: string | null;
  onVote?: (outcomeId: string) => void;
  voting?: boolean;
}

export default function OutcomePoll({ outcomes, votedOutcomeId, onVote, voting = false }: OutcomePollProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const totalVotes = outcomes.reduce((sum, o) => sum + o.vote_count, 0);
  const hasVoted = !!votedOutcomeId;
  const canVote = !!onVote && !hasVoted;

  const maxVotes = Math.max(...outcomes.map((o) => o.vote_count), 1);

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0c0c14] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <IconChartBar size={14} className="text-amaterasu-purple" />
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-scroll-cream/80">
            Predictions
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-mist-gray/40">
          <span>{totalVotes} total</span>
          <span>{outcomes.length} outcomes</span>
        </div>
      </div>

      {/* Outcomes */}
      <div className="p-4 space-y-2">
        {outcomes.map((outcome, i) => {
          const pct = totalVotes > 0 ? Math.round((outcome.vote_count / totalVotes) * 100) : 0;
          const isLeading = outcome.vote_count === maxVotes && totalVotes > 0;
          const colors = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
          const isHovered = hoveredId === outcome.id;
          const isVoted = votedOutcomeId === outcome.id;

          return (
            <motion.button
              key={outcome.id}
              type="button"
              disabled={!canVote || voting}
              className={`relative w-full text-left rounded-lg overflow-hidden transition-all
                ${canVote ? "cursor-pointer" : "cursor-default"}
              `}
              style={isVoted ? { boxShadow: `inset 0 0 0 1px ${colors.bar}` } : undefined}
              onClick={() => {
                if (!user) { setShowSignIn(true); toast("Sign in to vote", "info"); return; }
                canVote && onVote?.(outcome.id);
              }}
              onMouseEnter={() => setHoveredId(outcome.id)}
              onMouseLeave={() => setHoveredId(null)}
              whileHover={canVote ? { scale: 1.005 } : {}}
              whileTap={canVote ? { scale: 0.995 } : {}}
            >
              {/* Background */}
              <div
                className="absolute inset-0 transition-colors duration-300"
                style={{
                  background: isHovered || isVoted ? colors.glow : "rgba(255,255,255,0.02)",
                  borderLeft: `2px solid ${isHovered || isLeading || isVoted ? colors.bar : "transparent"}`,
                }}
              />

              {/* Fill bar */}
              <motion.div
                className="absolute inset-y-0 left-0"
                style={{ background: `${colors.bar}11` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 1.2, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              />

              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isVoted && (
                      <IconCheck size={13} style={{ color: colors.text }} />
                    )}
                    {isLeading && !isVoted && totalVotes > 0 && (
                      <IconArrowUp size={11} style={{ color: colors.text }} />
                    )}
                    <span className="text-[13px] font-heading text-scroll-cream/90">
                      {outcome.label}
                    </span>
                  </div>
                  {outcome.description && (
                    <p className="text-[10px] text-mist-gray/40 mt-0.5 truncate">{outcome.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <motion.span
                    className="text-lg font-mono font-bold"
                    style={{ color: colors.text }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {pct}
                    <span className="text-[10px] font-normal opacity-60">%</span>
                  </motion.span>

                  <span className="text-[9px] text-mist-gray/30 font-mono w-8 text-right">
                    {outcome.vote_count}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-center gap-2">
        {voting ? (
          <>
            <IconLoader2 size={11} className="text-amaterasu-purple animate-spin" />
            <span className="text-[10px] font-mono text-amaterasu-purple/60 uppercase tracking-wider">
              Recording vote...
            </span>
          </>
        ) : hasVoted ? (
          <span className="text-[10px] font-mono text-mist-gray/40 uppercase tracking-wider">
            Your prediction is recorded
          </span>
        ) : (
          <span className="text-[10px] font-mono text-mist-gray/40 uppercase tracking-wider">
            Tap to predict
          </span>
        )}
      </div>

      {/* Sign in prompt for unauthenticated users */}
      {showSignIn && !user && (
        <div className="px-5 py-3 border-t border-white/[0.04] text-center">
          <p className="text-xs text-mist-gray/40 mb-2">Sign in to cast your vote</p>
          <Link href="/auth/login" className="inline-block px-4 py-1.5 rounded-lg bg-scroll-cream text-[#0a0a0a] text-xs font-semibold hover:bg-scroll-cream/90 transition-colors">
            Sign in
          </Link>
        </div>
      )}
    </div>
  );
}
