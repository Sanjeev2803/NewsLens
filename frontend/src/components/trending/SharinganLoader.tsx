"use client";

import { motion } from "framer-motion";
import SharinganEye from "./SharinganEye";
import { COUNTRIES, LANGUAGES, CATEGORIES } from "./constants";

function SharinganLoader({ country, lang, category }: { country?: string; lang?: string; category?: string }) {
  const activeCountry = COUNTRIES.find((c) => c.code === country);
  const activeLang = LANGUAGES.find((l) => l.code === lang);
  const activeCat = CATEGORIES.find((c) => c.id === category);

  const LOADING_STEPS = [
    { text: "Connecting to sources", delay: 0 },
    { text: activeCountry ? `Scanning ${activeCountry.label} feeds` : "Scanning feeds", delay: 1.2 },
    { text: activeLang?.region ? `Filtering ${activeLang.region} intel` : "Filtering intel", delay: 2.4 },
    { text: activeCat ? `Ranking ${activeCat.label} stories` : "Ranking stories", delay: 3.6 },
    { text: "Enriching images", delay: 4.8 },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      {/* Sharingan eye with double pulse rings */}
      <div className="relative">
        <SharinganEye size={80} spin glow />
        <motion.div
          className="absolute inset-[-8px] rounded-full border border-sharingan-red/20"
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-[-16px] rounded-full border border-sharingan-red/10"
          animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Live step-by-step progress */}
      <div className="flex flex-col items-center gap-2 min-h-[80px]">
        {LOADING_STEPS.map((step, i) => (
          <motion.div
            key={step.text}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0.4], y: 0 }}
            transition={{ delay: step.delay, duration: 1.2, times: [0, 0.2, 0.7, 1] }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-sharingan-red"
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: step.delay + 0.1, duration: 0.4 }}
            />
            <span className="text-xs font-heading text-mist-gray/50 tracking-wide">
              {step.text}
            </span>
            {i < LOADING_STEPS.length - 1 && (
              <motion.span
                className="text-[10px] text-sage-green/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: step.delay + 1 }}
              >
                ✓
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Context badge */}
      {activeCountry && (
        <motion.div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.06]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm">{activeCountry.flag}</span>
          <span className="text-xs font-heading text-mist-gray/40">
            {activeCountry.label}
            {activeLang?.region && ` · ${activeLang.region}`}
            {activeCat && ` · ${activeCat.label}`}
          </span>
        </motion.div>
      )}

      {/* Skeleton preview of incoming cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
          >
            <motion.div
              className="h-32 bg-gradient-to-br from-white/[0.03] to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
            />
            <div className="p-4 space-y-2">
              <motion.div className="h-3 w-16 rounded bg-white/[0.05]" animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }} />
              <motion.div className="h-4 w-full rounded bg-white/[0.04]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 + i * 0.15 }} />
              <motion.div className="h-4 w-3/4 rounded bg-white/[0.03]" animate={{ opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 + i * 0.15 }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SharinganLoader;
