"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import {
  IconMapPin,
  IconArrowRight,
  IconWorld,
  IconX,
  IconExternalLink,
  IconClock,
} from "@tabler/icons-react";
import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from "d3-geo";
/* eslint-disable react-hooks/exhaustive-deps */
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

const WORLD_TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ArticleData {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

interface CountryHotspot {
  code: string;
  label: string;
  flag: string;
  articles: ArticleData[];
  totalArticles: number;
  breaking: number;
  topImage: string | null;
}

const COUNTRY_META: Record<string, { label: string; flag: string; numericId: string }> = {
  in: { label: "India", flag: "\u{1F1EE}\u{1F1F3}", numericId: "356" },
  us: { label: "USA", flag: "\u{1F1FA}\u{1F1F8}", numericId: "840" },
  gb: { label: "UK", flag: "\u{1F1EC}\u{1F1E7}", numericId: "826" },
  jp: { label: "Japan", flag: "\u{1F1EF}\u{1F1F5}", numericId: "392" },
  au: { label: "Australia", flag: "\u{1F1E6}\u{1F1FA}", numericId: "036" },
  ca: { label: "Canada", flag: "\u{1F1E8}\u{1F1E6}", numericId: "124" },
  de: { label: "Germany", flag: "\u{1F1E9}\u{1F1EA}", numericId: "276" },
  fr: { label: "France", flag: "\u{1F1EB}\u{1F1F7}", numericId: "250" },
  br: { label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", numericId: "076" },
  cn: { label: "China", flag: "\u{1F1E8}\u{1F1F3}", numericId: "156" },
  ru: { label: "Russia", flag: "\u{1F1F7}\u{1F1FA}", numericId: "643" },
  za: { label: "S. Africa", flag: "\u{1F1FF}\u{1F1E6}", numericId: "710" },
};

const ACTIVE_NUMERIC_IDS = new Set(Object.values(COUNTRY_META).map((m) => m.numericId));

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  in: [78.9, 22.0],
  us: [-98.5, 39.8],
  gb: [-2.0, 54.0],
  jp: [138.0, 36.5],
  au: [134.0, -25.5],
  ca: [-106.0, 56.0],
  de: [10.5, 51.2],
  fr: [2.5, 46.6],
  br: [-51.9, -14.2],
  cn: [104.0, 35.8],
  ru: [90.0, 62.0],
  za: [25.0, -29.0],
};

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;


function isSafeUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

/* Module-level geo cache to avoid refetching on every mount */
let geoDataCache: FeatureCollection<Geometry> | null = null;
let geoDataPromise: Promise<FeatureCollection<Geometry>> | null = null;

function loadGeoData(): Promise<FeatureCollection<Geometry>> {
  if (geoDataCache) return Promise.resolve(geoDataCache);
  if (geoDataPromise) return geoDataPromise;
  geoDataPromise = fetch(WORLD_TOPO_URL)
    .then((r) => r.json())
    .then((topo: Topology) => {
      const countries = feature(
        topo,
        topo.objects.countries as GeometryCollection
      ) as FeatureCollection<Geometry>;
      geoDataCache = countries;
      return countries;
    })
    .catch((err) => {
      geoDataPromise = null; // allow retry on failure
      throw err;
    });
  return geoDataPromise;
}

/* Module-level projection — inputs are constants, no need to compute twice */
const projection = geoNaturalEarth1().fitSize(
  [MAP_WIDTH, MAP_HEIGHT],
  { type: "Sphere" } as GeoPermissibleObjects
);

/* ── Article Reader Modal ── */
function ArticleModal({
  article,
  countryLabel,
  countryFlag,
  onClose,
}: {
  article: ArticleData;
  countryLabel: string;
  countryFlag: string;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0c0c14] border border-white/[0.08] shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <IconX size={16} className="text-white/70" />
        </button>

        {/* Hero image */}
        {article.image && (
          <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl">
            <img
              src={article.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6">
          {/* Source + time */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{countryFlag}</span>
            <span className="text-xs text-white/40">{countryLabel}</span>
            <span className="text-white/20">|</span>
            <span className="text-xs text-white/50 font-medium">{article.source.name}</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1 text-xs text-white/30">
              <IconClock size={11} />
              {timeAgo(article.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-heading font-bold text-white/90 leading-tight mb-4">
            {article.title}
          </h2>

          {/* Description / body */}
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">
            {article.description || "No description available for this article."}
          </p>

          {/* Read full article link */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <a
              href={isSafeUrl(article.url) ? article.url : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              Read full article on {article.source.name}
              <IconExternalLink size={14} />
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── SVG World Map ── */
function WorldMapSVG({
  hotspotMap,
  activeCountry,
}: {
  hotspotMap: Map<string, CountryHotspot>;
  activeCountry: string | null;
}) {
  const [geoData, setGeoData] = useState<FeatureCollection<Geometry> | null>(geoDataCache);

  useEffect(() => {
    if (geoDataCache) { setGeoData(geoDataCache); return; }
    let cancelled = false;
    loadGeoData()
      .then((data) => { if (!cancelled) setGeoData(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const pathGen = useMemo(() => geoPath(projection), []);

  const numericToCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const [code, meta] of Object.entries(COUNTRY_META)) {
      m.set(meta.numericId, code);
    }
    return m;
  }, []);

  return (
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-full">
      <defs>
        {/* Ocean gradient */}
        <radialGradient id="ocean-bg" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#0d1b2a" />
          <stop offset="100%" stopColor="#050a12" />
        </radialGradient>
        {/* Land fill for non-tracked countries */}
        <linearGradient id="land-default" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2838" />
          <stop offset="100%" stopColor="#141e2e" />
        </linearGradient>
        {/* Tracked country fill — teal tint */}
        <linearGradient id="land-tracked" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3040" />
          <stop offset="100%" stopColor="#162636" />
        </linearGradient>
        {/* Active country glow */}
        <filter id="country-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ocean background */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#ocean-bg)" />

      {/* Graticule grid lines */}
      <g stroke="rgba(255,255,255,0.04)" strokeWidth={0.3} fill="none" strokeDasharray="2,4">
        {/* Latitude lines */}
        {[-60, -30, 0, 30, 60].map((lat) => (
          <path key={`lat-${lat}`} d={pathGen({ type: "LineString", coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, lat]) } as GeoPermissibleObjects) || ""} />
        ))}
        {/* Longitude lines */}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
          <path key={`lon-${lon}`} d={pathGen({ type: "LineString", coordinates: Array.from({ length: 181 }, (_, i) => [lon, i - 90]) } as GeoPermissibleObjects) || ""} />
        ))}
      </g>

      {/* Sphere outline */}
      <path
        d={pathGen({ type: "Sphere" } as GeoPermissibleObjects) || ""}
        fill="none"
        stroke="rgba(100,180,220,0.08)"
        strokeWidth={0.8}
      />

      {/* Country shapes */}
      {geoData?.features.map((feat) => {
        const code = numericToCode.get(String(feat.id));
        const isTracked = code && ACTIVE_NUMERIC_IDS.has(String(feat.id));
        const hotspot = code ? hotspotMap.get(code) : null;
        const isActive = code === activeCountry;
        const hasBreaking = hotspot && hotspot.breaking > 0;

        let fill = "url(#land-default)";
        let stroke = "rgba(255,255,255,0.08)";
        let strokeW = 0.4;

        if (isTracked && hotspot) {
          fill = "url(#land-tracked)";
          stroke = "rgba(100,200,220,0.2)";
          strokeW = 0.6;
        }
        if (isActive) {
          fill = hasBreaking ? "#2a1520" : "#152a30";
          stroke = hasBreaking ? "rgba(230,80,80,0.5)" : "rgba(100,220,220,0.4)";
          strokeW = 1.2;
        }

        return (
          <path
            key={String(feat.id)}
            d={pathGen(feat as GeoPermissibleObjects) || ""}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeW}
            filter={isActive ? "url(#country-glow)" : undefined}
            className={isTracked ? "cursor-pointer" : ""}
            style={isTracked ? { transition: "fill 0.3s, stroke 0.3s" } : undefined}
            onClick={code ? () => {
              /* bubble to parent via custom event */
            } : undefined}
          />
        );
      })}

      {!geoData && (
        <text x={MAP_WIDTH / 2} y={MAP_HEIGHT / 2} textAnchor="middle" fill="rgba(100,180,220,0.3)" fontSize={13} fontFamily="sans-serif">
          Loading map...
        </text>
      )}
    </svg>
  );
}

/* ── Thumbnail Hotspot (HTML overlay) ── */
function ThumbnailHotspot({
  hotspot,
  x,
  y,
  isActive,
  onClick,
}: {
  hotspot: CountryHotspot;
  x: number;
  y: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasImage = !!hotspot.topImage;
  const hasBreaking = hotspot.breaking > 0;
  const size = isActive ? 48 : 40;

  return (
    <button
      onClick={onClick}
      className="absolute z-10 group"
      style={{
        left: `${(x / MAP_WIDTH) * 100}%`,
        top: `${(y / MAP_HEIGHT) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Ambient glow behind thumbnail */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 30,
          height: size + 30,
          left: -(size + 30) / 2 + size / 2,
          top: -(size + 30) / 2 + size / 2,
          background: hasBreaking
            ? "radial-gradient(circle, rgba(230,60,60,0.25) 0%, transparent 70%)"
            : isActive
              ? "radial-gradient(circle, rgba(100,220,220,0.2) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(100,180,220,0.12) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />

      {/* Pulse rings for breaking */}
      {hasBreaking && (
        <>
          <motion.div
            className="absolute rounded-full border border-red-400/40"
            style={{ width: size, height: size, left: 0, top: 0 }}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute rounded-full border border-red-400/20"
            style={{ width: size, height: size, left: 0, top: 0 }}
            animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Active selection ring */}
      {isActive && !hasBreaking && (
        <motion.div
          className="absolute rounded-full border border-cyan-400/30"
          style={{ width: size, height: size, left: 0, top: 0 }}
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Thumbnail circle */}
      <div
        className="relative rounded-full overflow-hidden transition-all duration-300"
        style={{
          width: size,
          height: size,
          border: isActive
            ? "2.5px solid rgba(100,220,220,0.6)"
            : hasBreaking
              ? "2.5px solid rgba(230,80,80,0.6)"
              : "2px solid rgba(100,180,220,0.25)",
          boxShadow: isActive
            ? "0 0 24px rgba(100,220,220,0.3), 0 2px 8px rgba(0,0,0,0.5)"
            : hasBreaking
              ? "0 0 20px rgba(230,60,60,0.25), 0 2px 8px rgba(0,0,0,0.5)"
              : "0 0 12px rgba(100,180,220,0.1), 0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {hasImage ? (
          <img
            src={hotspot.topImage!}
            alt={hotspot.label}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              img.parentElement?.classList.add("bg-cyan-950/50");
            }}
          />
        ) : (
          <div className="w-full h-full bg-cyan-950/40 flex items-center justify-center text-base">
            {hotspot.flag}
          </div>
        )}
      </div>

      {/* Country label — always visible on desktop, hover on mobile */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap hidden sm:block">
        <span
          className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm"
          style={{
            color: isActive ? "rgba(100,220,220,0.9)" : hasBreaking ? "rgba(230,120,120,0.8)" : "rgba(150,200,220,0.5)",
            background: "rgba(5,10,18,0.7)",
          }}
        >
          {hotspot.label}
        </span>
      </div>
    </button>
  );
}

/* ── Main Component ── */
export default function NewsPulseMap() {
  const [hotspots, setHotspots] = useState<CountryHotspot[]>([]);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [modalArticle, setModalArticle] = useState<{ article: ArticleData; code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: AbortController;

    async function fetchAllCountries() {
      controller = new AbortController();
      setLoading(true);
      try {
        const res = await fetch("/api/news/batch?category=general&lang=en&max=3", {
          signal: controller.signal,
        });
        if (!res.ok || cancelled) return;
        const batch = await res.json();
        if (cancelled) return;
        const oneHourAgo = Date.now() - 3600000;
        const spots: CountryHotspot[] = [];

        for (const code of Object.keys(COUNTRY_META)) {
          const data = batch[code];
          if (!data || !data.articles) continue;
          const meta = COUNTRY_META[code];
          const articles: ArticleData[] = (data.articles || []).map(
            (a: ArticleData) => ({
              title: a.title,
              description: a.description || "",
              url: a.url,
              image: a.image || null,
              publishedAt: a.publishedAt,
              source: a.source || { name: "Unknown", url: "" },
            })
          );
          const breaking = articles.filter(
            (a) => new Date(a.publishedAt).getTime() > oneHourAgo
          ).length;
          const topImage = articles.find((a) => a.image)?.image || null;

          spots.push({
            code,
            label: meta.label,
            flag: meta.flag,
            articles,
            totalArticles: data.totalArticles || articles.length,
            breaking,
            topImage,
          });
        }
        if (!cancelled) {
          setHotspots(spots);
          setLoading(false);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!cancelled) setLoading(false);
      }
    }
    fetchAllCountries();
    const interval = setInterval(fetchAllCountries, 120000);
    return () => {
      cancelled = true;
      controller?.abort();
      clearInterval(interval);
    };
  }, []);

  const hotspotMap = useMemo(() => {
    const m = new Map<string, CountryHotspot>();
    for (const h of hotspots) m.set(h.code, h);
    return m;
  }, [hotspots]);

  const projectedHotspots = useMemo(() => {
    return hotspots
      .map((h) => {
        const coords = COUNTRY_CENTROIDS[h.code];
        if (!coords) return null;
        const p = projection(coords);
        if (!p) return null;
        return { hotspot: h, x: p[0], y: p[1] };
      })
      .filter(Boolean) as { hotspot: CountryHotspot; x: number; y: number }[];
  }, [hotspots, projection]);

  const activeHotspot = useMemo(() => hotspots.find((h) => h.code === activeCountry), [hotspots, activeCountry]);

  const handleCountryClick = useCallback(
    (code: string) => setActiveCountry((prev) => (prev === code ? null : code)),
    []
  );

  const handleArticleClick = useCallback((article: ArticleData, code: string) => {
    setModalArticle({ article, code });
  }, []);

  const handleCloseModal = useCallback(() => setModalArticle(null), []);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <IconMapPin size={16} className="text-white/50" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-semibold text-white/90">News Pulse Map</h2>
          <p className="text-[11px] text-white/30">Live global heatmap — tap thumbnails to explore</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/globe"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-heading text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          >
            <IconWorld size={14} /> Globe View
          </Link>
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono text-white/25">LIVE</span>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[2/1] rounded-2xl border border-cyan-900/30 bg-[#050a12] overflow-hidden shadow-[0_0_60px_rgba(0,80,120,0.08)]"
      >
        {/* SVG map layer */}
        <WorldMapSVG hotspotMap={hotspotMap} activeCountry={activeCountry} />

        {/* Thumbnail hotspots (HTML overlay) */}
        {projectedHotspots.map(({ hotspot, x, y }) => (
          <ThumbnailHotspot
            key={hotspot.code}
            hotspot={hotspot}
            x={x}
            y={y}
            isActive={activeCountry === hotspot.code}
            onClick={() => handleCountryClick(hotspot.code)}
          />
        ))}

        {loading && hotspots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <motion.div
              className="text-xs text-white/20"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Scanning global feeds...
            </motion.div>
          </div>
        )}
      </div>

      {/* Article cards for active country */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div
            className="mt-4 rounded-xl border border-white/[0.06] bg-[#08080f]/90 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
          >
            <div className="p-4">
              {/* Country header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeHotspot.flag}</span>
                  <span className="font-heading font-semibold text-white/80">{activeHotspot.label}</span>
                  <span className="text-xs text-white/30">{activeHotspot.totalArticles} stories</span>
                </div>
                <Link
                  href="/trending"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/50 hover:text-white/70 transition-all"
                >
                  See all <IconArrowRight size={12} />
                </Link>
              </div>

              {/* Article cards — click to read */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeHotspot.articles.slice(0, 3).map((article, i) => (
                  <button
                    key={article.url || i}
                    onClick={() => handleArticleClick(article, activeHotspot.code)}
                    className="text-left rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all overflow-hidden group"
                  >
                    {/* Article thumbnail */}
                    {article.image && (
                      <div className="w-full aspect-[16/9] overflow-hidden">
                        <img
                          src={article.image}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).parentElement?.style.setProperty("display", "none"); }}
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-medium text-white/70 line-clamp-2 leading-relaxed group-hover:text-white/90 transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-white/30">{article.source.name}</span>
                        <span className="text-[10px] text-white/20">{timeAgo(article.publishedAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
          <span className="text-[10px] text-white/20">Breaking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="text-[10px] text-white/20">Active</span>
        </div>
        <span className="text-[10px] text-white/15 ml-auto">Refreshes every 2 min</span>
      </div>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {modalArticle && (
          <ArticleModal
            article={modalArticle.article}
            countryLabel={COUNTRY_META[modalArticle.code]?.label || ""}
            countryFlag={COUNTRY_META[modalArticle.code]?.flag || ""}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
