"use client";

import { motion } from "framer-motion";
import { IconFlame, IconClock, IconChartBar, IconCategory } from "@tabler/icons-react";

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "all", label: "All Markets", color: "#7B2FBE" },
  { value: "politics", label: "Politics", color: "#E63946" },
  { value: "economy", label: "Economy", color: "#FF6B00" },
  { value: "tech", label: "Tech", color: "#00B4D8" },
  { value: "society", label: "Society", color: "#2DC653" },
  { value: "sports", label: "Sports", color: "#F4A261" },
  { value: "entertainment", label: "Entertainment", color: "#E76F51" },
];

const SORTS = [
  { value: "trending", label: "Trending", icon: IconFlame },
  { value: "newest", label: "New", icon: IconClock },
  { value: "most_voted", label: "Top Volume", icon: IconChartBar },
];

interface WhatIfFiltersProps {
  category: string;
  sort: string;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: string) => void;
}

export default function WhatIfFilters({ category, sort, onCategoryChange, onSortChange }: WhatIfFiltersProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Categories — pill style */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        <IconCategory size={14} className="text-mist-gray/40 shrink-0 mr-1" />
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`
                relative whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider transition-all duration-200
                ${isActive
                  ? "text-white"
                  : "text-mist-gray/50 hover:text-mist-gray/80 hover:bg-white/[0.03]"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="whatif-cat-pill"
                  className="absolute inset-0 rounded-md"
                  style={{ background: `${cat.color}cc` }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort — minimal toggle */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04] shrink-0">
        {SORTS.map((s) => {
          const Icon = s.icon;
          const isActive = sort === s.value;
          return (
            <button
              key={s.value}
              onClick={() => onSortChange(s.value)}
              className={`
                relative flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all
                ${isActive
                  ? "text-amaterasu-purple"
                  : "text-mist-gray/40 hover:text-mist-gray/70"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="whatif-sort"
                  className="absolute inset-0 rounded-md bg-amaterasu-purple/10 border border-amaterasu-purple/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={11} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
