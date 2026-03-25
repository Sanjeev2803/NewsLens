"use client";

import { useState, useCallback } from "react";
import WhatIfHero from "@/components/whatif/WhatIfHero";
import WhatIfFilters from "@/components/whatif/WhatIfFilters";
import WhatIfFeed from "@/components/whatif/WhatIfFeed";
import type { Scenario } from "@/lib/whatif/types";
import { useGeoCountry } from "@/lib/useGeoCountry";

export default function WhatIfPageClient() {
  const country = useGeoCountry();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
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
        onStatsUpdate={onStatsUpdate}
      />
    </>
  );
}
