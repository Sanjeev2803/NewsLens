"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatIfHero from "@/components/whatif/WhatIfHero";
import WhatIfFilters from "@/components/whatif/WhatIfFilters";
import WhatIfFeed from "@/components/whatif/WhatIfFeed";
import type { Scenario } from "@/lib/whatif/types";

export default function WhatIfPage() {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/whatif?category=all&sort=trending&page=1&limit=20")
      .then((r) => r.json())
      .then((data) => {
        setScenarios(data.scenarios || []);
        setTotal(data.total || 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const totalVotes = scenarios.reduce((sum, s) => sum + (s.vote_count || 0), 0);
  const hotScenario = scenarios.length > 0 ? scenarios[0] : null;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto py-6">
          <WhatIfHero
            totalScenarios={total}
            totalVotes={totalVotes}
            hotScenario={hotScenario}
          />
          <WhatIfFilters
            category={category}
            sort={sort}
            onCategoryChange={setCategory}
            onSortChange={setSort}
          />
          {loaded && (
            <WhatIfFeed
              initialScenarios={scenarios}
              initialTotal={total}
              category={category}
              sort={sort}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
