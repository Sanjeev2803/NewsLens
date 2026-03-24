"use client";

import { useState, useEffect } from "react";

/*
  Auto-detect user's country from IP (via Vercel header on production,
  defaults to "in" on localhost). Caches in sessionStorage for the session.
*/

const STORAGE_KEY = "newslens_geo_country";

export function useGeoCountry(fallback = "in"): string {
  const [country, setCountry] = useState<string>(() => {
    if (typeof window === "undefined") return fallback;
    return sessionStorage.getItem(STORAGE_KEY) || fallback;
  });

  useEffect(() => {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      setCountry(cached);
      return;
    }

    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => {
        const c = data.country || fallback;
        sessionStorage.setItem(STORAGE_KEY, c);
        setCountry(c);
      })
      .catch(() => {
        // Silently fall back — geo is a nice-to-have, not critical
      });
  }, [fallback]);

  return country;
}
