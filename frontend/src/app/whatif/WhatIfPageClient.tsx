"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import WhatIfHero from "@/components/whatif/WhatIfHero";
import WhatIfFilters from "@/components/whatif/WhatIfFilters";
import WhatIfFeed from "@/components/whatif/WhatIfFeed";
import type { Scenario } from "@/lib/whatif/types";
import { useGeoCountry } from "@/lib/useGeoCountry";
import { IconPencilPlus } from "@tabler/icons-react";

export default function WhatIfPageClient() {
  const country = useGeoCountry();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
  const [source, setSource] = useState<"all" | "ai" | "community">("all");
  const [heroStats, setHeroStats] = useState<{ total: number; totalVotes: number; hot: Scenario | null }>({
    total: 0,
    totalVotes: 0,
    hot: null,
  });

  const onStatsUpdate = useCallback((scenarios: Scenario[], total: number) => {
    setHeroStats({
      total,
      totalVotes: scenarios.reduce((sum, s) => sum + (s.vote_count || 0), 0),
      hot: scenarios[0] || null,
    });
  }, []);

  return (
    <>
      <WhatIfHero
        totalScenarios={heroStats.total}
        totalVotes={heroStats.totalVotes}
        hotScenario={heroStats.hot}
      />

      {/* Source tabs + Create button */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4 mt-6 mb-2">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/[0.04]">
          {(["all", "ai", "community"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium transition-all ${
                source === s
                  ? "bg-white/10 text-scroll-cream"
                  : "text-mist-gray/50 hover:text-mist-gray/80"
              }`}
            >
              {s === "all" ? "All" : s === "ai" ? "AI Generated" : "Community"}
            </button>
          ))}
        </div>
        <Link
          href="/whatif/create"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-scroll-cream text-[#0a0a0a] text-xs font-semibold hover:bg-scroll-cream/90 transition-colors"
        >
          <IconPencilPlus size={14} />
          Create Prediction
        </Link>
      </div>

      <WhatIfFilters
        category={category}
        sort={sort}
        onCategoryChange={setCategory}
        onSortChange={setSort}
      />
      <WhatIfFeed
        category={category}
        sort={sort}
        country={country}
        source={source}
        onStatsUpdate={onStatsUpdate}
      />
    </>
  );
}
