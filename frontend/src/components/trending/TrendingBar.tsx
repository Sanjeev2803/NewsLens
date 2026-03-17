"use client";

import { motion } from "framer-motion";
import type { TrendingTopic } from "@/types/news";

function TrendingBar({ topics, region }: { topics: TrendingTopic[]; region: string | null }) {
  if (topics.length === 0) return null;
  return (
    <motion.div className="mb-6 rounded-xl border border-chakra-orange/10 bg-[#0a0a10]/60 backdrop-blur-sm overflow-hidden" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="px-4 py-2.5 border-b border-chakra-orange/8 flex items-center gap-2">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
          <svg viewBox="0 0 16 16" className="w-4 h-4 text-chakra-orange"><path d="M8 1l2 4 4.5.5-3.25 3 .75 4.5L8 11l-4 2 .75-4.5L1.5 5.5 6 5z" fill="currentColor" /></svg>
        </motion.div>
        <span className="text-xs font-heading font-bold text-chakra-orange uppercase tracking-wider">Trending {region ? `in ${region}` : ""}</span>
        <span className="text-[10px] text-mist-gray/40 ml-auto font-mono">Google Trends</span>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
        {topics.map((t, i) => (
          <a key={`${t.title}-${i}`} href={t.url || `https://www.google.com/search?q=${encodeURIComponent(t.title)}`} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-chakra-orange/5 border border-chakra-orange/10 text-xs font-heading text-scroll-cream hover:bg-chakra-orange/15 hover:border-chakra-orange/25 transition-all">
            <span className="text-chakra-orange mr-1.5">#{i + 1}</span>{t.title}
            {t.traffic && <span className="ml-1.5 text-[10px] text-mist-gray/40">{t.traffic}</span>}
          </a>
        ))}
      </div>
    </motion.div>
  );
}

export default TrendingBar;
