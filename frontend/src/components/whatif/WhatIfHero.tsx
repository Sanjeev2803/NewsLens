"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import {
  IconSparkles,
  IconFlame,
  IconUsers,
  IconChartBar,
  IconBolt,
  IconArrowUpRight,
} from "@tabler/icons-react";
import Link from "next/link";
import type { Scenario } from "@/lib/whatif/types";

interface WhatIfHeroProps {
  totalScenarios: number;
  totalVotes: number;
  hotScenario?: Scenario | null;
}

function GlowOrb({ delay, x, y, size, color }: { delay: number; x: number; y: number; size: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(40px)",
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function LiveTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      className="flex items-center gap-1.5"
      key={tick}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-green opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sage-green" />
      </span>
      <span className="text-sage-green text-[11px] font-mono uppercase tracking-wider">Live</span>
    </motion.div>
  );
}

export default function WhatIfHero({ totalScenarios, totalVotes, hotScenario }: WhatIfHeroProps) {
  const orbs = useMemo(() => [
    { delay: 0, x: 10, y: 20, size: 200, color: "rgba(123,47,190,0.4)" },
    { delay: 2, x: 70, y: 10, size: 150, color: "rgba(230,57,70,0.3)" },
    { delay: 4, x: 50, y: 60, size: 180, color: "rgba(0,180,216,0.25)" },
    { delay: 1, x: 85, y: 50, size: 120, color: "rgba(255,107,0,0.2)" },
  ], []);

  const hotOutcomes = hotScenario?.outcomes || [];
  const hotTotal = hotOutcomes.reduce((s, o) => s + o.vote_count, 0);
  const topOutcome = hotOutcomes.length > 0 ? hotOutcomes.reduce((a, b) => a.vote_count > b.vote_count ? a : b) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#08080d]" />

      {/* Animated glow orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {orbs.map((orb, i) => <GlowOrb key={i} {...orb} />)}
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(123,47,190,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(123,47,190,0.8) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div className="relative z-10 px-6 md:px-10 py-10 md:py-14">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left: Branding + Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest"
                style={{ background: "linear-gradient(135deg, rgba(123,47,190,0.3), rgba(230,57,70,0.2))", border: "1px solid rgba(123,47,190,0.3)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <IconBolt size={12} className="text-amaterasu-purple" />
                <span className="text-scroll-cream/80">Prediction Engine</span>
              </motion.div>
              <LiveTicker />
            </div>

            <motion.h1
              className="font-brand text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-scroll-cream">What-If</span>
              <br />
              <span className="bg-gradient-to-r from-amaterasu-purple via-sharingan-red to-chakra-orange bg-clip-text text-transparent">
                Dimension
              </span>
            </motion.h1>

            <motion.p
              className="text-mist-gray/80 font-body text-sm md:text-base max-w-md leading-relaxed mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              AI transforms trending news into speculative scenarios.
              Predict outcomes, build timelines, challenge reality.
            </motion.p>

            {/* Stats row — Polymarket style */}
            <motion.div
              className="flex items-center gap-5 text-[11px] font-mono uppercase tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-1.5">
                <IconChartBar size={14} className="text-amaterasu-purple" />
                <span className="text-scroll-cream">{totalScenarios}</span>
                <span className="text-mist-gray/60">Markets</span>
              </div>
              <div className="w-px h-3 bg-mist-gray/20" />
              <div className="flex items-center gap-1.5">
                <IconUsers size={14} className="text-rasengan-blue" />
                <span className="text-scroll-cream">{totalVotes}</span>
                <span className="text-mist-gray/60">Predictions</span>
              </div>
              <div className="w-px h-3 bg-mist-gray/20" />
              <div className="flex items-center gap-1.5">
                <IconSparkles size={14} className="text-chakra-orange" />
                <span className="text-mist-gray/60">AI-Powered</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Hot Prediction Card */}
          {hotScenario && (
            <motion.div
              className="w-full lg:w-[380px] shrink-0"
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link href={`/whatif/${hotScenario.id}`}>
                <div className="group relative rounded-xl overflow-hidden cursor-pointer">
                  {/* Card glow */}
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-amaterasu-purple/50 via-sharingan-red/30 to-chakra-orange/40 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative rounded-xl bg-[#0f0f18] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconFlame size={14} className="text-sharingan-red" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-sharingan-red">
                          Hot Prediction
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-mist-gray/60">
                        {hotOutcomes.length} outcomes
                      </span>
                    </div>

                    <h3 className="font-title text-base text-scroll-cream leading-snug mb-4 group-hover:text-amaterasu-purple transition-colors">
                      {hotScenario.title}
                    </h3>

                    {/* Outcome bars — Polymarket style */}
                    <div className="space-y-2 mb-4">
                      {hotOutcomes.slice(0, 3).map((outcome, i) => {
                        const pct = hotTotal > 0 ? Math.round((outcome.vote_count / hotTotal) * 100) : Math.round(100 / hotOutcomes.length);
                        const colors = ["#7B2FBE", "#E63946", "#00B4D8", "#FF6B00"];
                        return (
                          <div key={outcome.id} className="flex items-center gap-2">
                            <div className="flex-1 h-7 rounded-md bg-white/[0.04] overflow-hidden relative">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-md"
                                style={{ background: `${colors[i % 4]}33` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(pct, 5)}%` }}
                                transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                              />
                              <div className="relative flex items-center justify-between h-full px-2.5">
                                <span className="text-[11px] font-heading text-scroll-cream/90 truncate">
                                  {outcome.label}
                                </span>
                              </div>
                            </div>
                            <span className="w-10 text-right text-xs font-mono font-bold" style={{ color: colors[i % 4] }}>
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-mist-gray/60 font-mono">
                        {hotTotal} predictions
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-amaterasu-purple font-heading opacity-0 group-hover:opacity-100 transition-opacity">
                        Predict Now
                        <IconArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
