"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/*
  useNewsStream — SSE hook with automatic polling fallback.

  Connects to /api/news/stream via EventSource for live updates.
  Falls back to regular fetch polling if SSE fails or isn't supported.
*/

interface NewsStreamData {
  articles: any[];
  totalArticles: number;
  freshCount: number;
  sources: string[];
}

interface UseNewsStreamOptions {
  category: string;
  country: string;
  lang: string;
  max: number;
  enabled?: boolean;
}

export function useNewsStream({
  category,
  country,
  lang,
  max,
  enabled = true,
}: UseNewsStreamOptions) {
  const [data, setData] = useState<NewsStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFallback = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/news?category=${category}&country=${country}&lang=${lang}&max=${max}`
      );
      if (!res.ok) return;
      const json = await res.json();
      setData({
        articles: json.articles || [],
        totalArticles: json.totalArticles || 0,
        freshCount: json.freshCount || 0,
        sources: json.sources || [],
      });
      setLoading(false);
      setError(null);
    } catch {
      setError("Failed to fetch news");
      setLoading(false);
    }
  }, [category, country, lang, max]);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    function connectSSE() {
      // Clean up previous connection
      eventSourceRef.current?.close();
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);

      const url = `/api/news/stream?category=${category}&country=${country}&lang=${lang}&max=${max}`;

      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener("news", (event) => {
          if (!mounted) return;
          try {
            const parsed = JSON.parse(event.data);
            setData(parsed);
            setLoading(false);
            setError(null);
          } catch { /* malformed event */ }
        });

        function handleSSEError() {
          if (!mounted) return;
          es.close();
          eventSourceRef.current = null;
          // Clear any existing fallback interval before creating a new one
          if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
          fetchFallback();
          fallbackIntervalRef.current = setInterval(fetchFallback, 60_000);
        }

        es.addEventListener("error", handleSSEError);
        es.onerror = handleSSEError;
      } catch {
        // EventSource not supported — fallback
        fetchFallback();
        fallbackIntervalRef.current = setInterval(fetchFallback, 60_000);
      }
    }

    connectSSE();

    return () => {
      mounted = false;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    };
  }, [category, country, lang, max, enabled, fetchFallback]);

  return { data, loading, error };
}
