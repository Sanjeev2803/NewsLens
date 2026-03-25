"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { IconLoader2, IconMoodEmpty, IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import type { Scenario } from "@/lib/whatif/types";
import WhatIfCard from "./WhatIfCard";

interface WhatIfFeedProps {
  category: string;
  sort: string;
  country?: string;
  onStatsUpdate?: (scenarios: Scenario[], total: number) => void;
}

export default function WhatIfFeed({ category, sort, country = "in", onStatsUpdate }: WhatIfFeedProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort any in-flight fetch so stale responses never overwrite current filters
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setPage(1);
    fetch(`/api/whatif?category=${category}&sort=${sort}&country=${country}&page=1&limit=20`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 429 ? "Too many requests — try again shortly" : "Failed to load predictions");
        return r.json();
      })
      .then((data) => {
        const items = data.scenarios || [];
        setScenarios(items);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
        onStatsUpdate?.(items, data.total || 0);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category, sort, country, onStatsUpdate]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    fetch(`/api/whatif?category=${category}&sort=${sort}&country=${country}&page=${nextPage}&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load more");
        return r.json();
      })
      .then((data) => {
        setScenarios((prev) => [...prev, ...(data.scenarios || [])]);
        setHasMore(data.hasMore || false);
        setPage(nextPage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, category, sort, country, loading, hasMore]);

  if (loading && scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-amaterasu-purple/20 border-t-amaterasu-purple animate-spin" />
        </div>
        <span className="text-[11px] font-mono text-mist-gray/40 uppercase tracking-wider">Loading predictions...</span>
      </div>
    );
  }

  if (error && scenarios.length === 0) {
    return (
      <motion.div
        className="text-center py-20 rounded-xl border border-sharingan-red/10 bg-sharingan-red/[0.02]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <IconAlertTriangle size={40} className="mx-auto text-sharingan-red/40 mb-3" />
        <p className="text-mist-gray/60 font-heading text-sm">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            fetch(`/api/whatif?category=${category}&sort=${sort}&country=${country}&page=1&limit=20`)
              .then((r) => { if (!r.ok) throw new Error("Retry failed"); return r.json(); })
              .then((data) => {
                setScenarios(data.scenarios || []);
                setTotal(data.total || 0);
                setHasMore(data.hasMore || false);
                onStatsUpdate?.(data.scenarios || [], data.total || 0);
              })
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider
            border border-white/[0.06] text-mist-gray/50 hover:text-amaterasu-purple hover:border-amaterasu-purple/30 transition-all"
        >
          <IconRefresh size={12} />
          Retry
        </button>
      </motion.div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <motion.div
        className="text-center py-20 rounded-xl border border-white/[0.04] bg-white/[0.01]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <IconMoodEmpty size={40} className="mx-auto text-mist-gray/20 mb-3" />
        <p className="text-mist-gray/60 font-heading text-sm">No predictions in this dimension</p>
        <p className="text-mist-gray/30 font-mono text-[10px] mt-1 uppercase tracking-wider">
          Try a different category or check back soon
        </p>
      </motion.div>
    );
  }

  // First card is featured (larger), rest are grid
  const featured = scenarios[0];
  const rest = scenarios.slice(1);

  return (
    <div>
      {/* Inline error banner for load-more failures */}
      {error && scenarios.length > 0 && (
        <div className="mb-4 px-4 py-2 rounded-lg border border-sharingan-red/10 bg-sharingan-red/[0.03] text-[11px] font-mono text-sharingan-red/60 text-center">
          {error}
        </div>
      )}

      {/* Featured prediction — full width */}
      {featured && (
        <div className="mb-4">
          <WhatIfCard scenario={featured} index={0} featured={true} />
        </div>
      )}

      {/* Grid of predictions */}
      {rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((scenario, i) => (
            <WhatIfCard key={scenario.id} scenario={scenario} index={i + 1} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-all
              bg-white/[0.03] border border-white/[0.06] text-mist-gray/60
              hover:border-amaterasu-purple/30 hover:text-amaterasu-purple hover:bg-amaterasu-purple/5
              disabled:opacity-40"
          >
            {loading ? (
              <IconLoader2 size={13} className="animate-spin" />
            ) : (
              <IconRefresh size={13} className="group-hover:rotate-180 transition-transform duration-500" />
            )}
            {loading ? "Loading..." : "Load More Predictions"}
          </button>
        </div>
      )}
    </div>
  );
}
