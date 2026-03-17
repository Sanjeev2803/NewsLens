"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IconMapPin, IconArrowRight, IconCircleFilled } from "@tabler/icons-react";

/*
  News Pulse Map — Snapchat-style heatmap on a real SVG world map.
  Uses Natural Earth simplified world SVG paths.
  Countries glow based on live news activity.
*/

interface CountryHotspot {
  code: string;
  label: string;
  flag: string;
  x: number;
  y: number;
  articles: number;
  breaking: number;
  topHeadline?: string;
}

const COUNTRY_POSITIONS: Record<string, { x: number; y: number }> = {
  in: { x: 68, y: 52 },
  us: { x: 22, y: 40 },
  gb: { x: 47, y: 28 },
  jp: { x: 86, y: 38 },
  au: { x: 83, y: 74 },
  ca: { x: 20, y: 26 },
  de: { x: 50, y: 30 },
  fr: { x: 47, y: 34 },
  br: { x: 32, y: 65 },
  cn: { x: 77, y: 40 },
  ru: { x: 65, y: 22 },
  za: { x: 55, y: 74 },
};

const COUNTRY_META: Record<string, { label: string; flag: string }> = {
  in: { label: "India", flag: "🇮🇳" },
  us: { label: "USA", flag: "🇺🇸" },
  gb: { label: "UK", flag: "🇬🇧" },
  jp: { label: "Japan", flag: "🇯🇵" },
  au: { label: "Australia", flag: "🇦🇺" },
  ca: { label: "Canada", flag: "🇨🇦" },
  de: { label: "Germany", flag: "🇩🇪" },
  fr: { label: "France", flag: "🇫🇷" },
  br: { label: "Brazil", flag: "🇧🇷" },
  cn: { label: "China", flag: "🇨🇳" },
  ru: { label: "Russia", flag: "🇷🇺" },
  za: { label: "S. Africa", flag: "🇿🇦" },
};

/* Simplified continent SVG paths (Natural Earth inspired, hand-optimized for performance) */
function WorldSVG() {
  return (
    <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,107,0,0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="1000" height="500" fill="url(#map-glow)" />

      {/* Continents — simplified outlines */}
      <g fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8">
        {/* North America */}
        <path d="M120,100 C140,80 180,70 200,80 C230,65 260,70 270,90 L280,120 C290,140 260,160 240,180 L220,200 C200,220 180,230 160,220 L140,200 C120,180 100,160 110,140 Z" />
        {/* Central America */}
        <path d="M180,220 C190,230 200,240 210,250 L220,270 C215,280 200,285 195,275 L185,255 C175,240 175,230 180,220 Z" />
        {/* South America */}
        <path d="M240,280 C260,270 290,280 310,300 L320,340 C330,370 320,400 300,420 L280,430 C260,420 240,400 235,370 L230,340 C225,310 230,290 240,280 Z" />
        {/* Europe */}
        <path d="M440,100 C460,90 480,95 500,100 L520,110 C540,120 550,140 540,155 L520,160 C500,165 480,158 460,150 L445,140 C435,130 435,110 440,100 Z" />
        {/* Africa */}
        <path d="M460,220 C480,210 510,215 530,230 L545,260 C555,290 550,330 540,360 L520,380 C500,390 480,385 465,370 L450,340 C440,310 440,280 445,250 Z" />
        {/* Asia */}
        <path d="M550,80 C580,70 640,75 700,90 L750,100 C790,110 820,130 830,160 L820,190 C800,210 770,220 740,215 L700,210 C660,205 620,190 590,170 L560,150 C540,130 540,100 550,80 Z" />
        {/* India subcontinent */}
        <path d="M640,200 C660,190 680,195 690,210 L695,240 C690,270 675,290 660,280 L645,260 C635,240 635,215 640,200 Z" />
        {/* Southeast Asia */}
        <path d="M730,220 C750,215 770,225 780,240 L790,260 C785,275 770,280 755,275 L740,260 C730,245 728,230 730,220 Z" />
        {/* Japan */}
        <path d="M840,140 C845,130 855,128 860,135 L862,160 C858,175 850,180 845,170 L842,155 Z" />
        {/* Australia */}
        <path d="M780,340 C810,330 850,340 860,360 L855,390 C840,405 810,410 790,400 L775,380 C770,365 770,350 780,340 Z" />
        {/* UK/Ireland */}
        <path d="M455,110 C458,105 465,103 468,108 L470,118 C467,125 460,127 457,122 Z" />
      </g>

      {/* Continent fill — very subtle */}
      <g fill="rgba(255,255,255,0.015)" stroke="none">
        <path d="M120,100 C140,80 180,70 200,80 C230,65 260,70 270,90 L280,120 C290,140 260,160 240,180 L220,200 C200,220 180,230 160,220 L140,200 C120,180 100,160 110,140 Z" />
        <path d="M240,280 C260,270 290,280 310,300 L320,340 C330,370 320,400 300,420 L280,430 C260,420 240,400 235,370 L230,340 C225,310 230,290 240,280 Z" />
        <path d="M440,100 C460,90 480,95 500,100 L520,110 C540,120 550,140 540,155 L520,160 C500,165 480,158 460,150 L445,140 C435,130 435,110 440,100 Z" />
        <path d="M460,220 C480,210 510,215 530,230 L545,260 C555,290 550,330 540,360 L520,380 C500,390 480,385 465,370 L450,340 C440,310 440,280 445,250 Z" />
        <path d="M550,80 C580,70 640,75 700,90 L750,100 C790,110 820,130 830,160 L820,190 C800,210 770,220 740,215 L700,210 C660,205 620,190 590,170 L560,150 C540,130 540,100 550,80 Z" />
        <path d="M640,200 C660,190 680,195 690,210 L695,240 C690,270 675,290 660,280 L645,260 C635,240 635,215 640,200 Z" />
        <path d="M780,340 C810,330 850,340 860,360 L855,390 C840,405 810,410 790,400 L775,380 C770,365 770,350 780,340 Z" />
      </g>

      {/* Grid lines — lat/long */}
      <g stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" fill="none">
        <line x1="0" y1="250" x2="1000" y2="250" /> {/* equator */}
        <line x1="0" y1="125" x2="1000" y2="125" />
        <line x1="0" y1="375" x2="1000" y2="375" />
        <line x1="500" y1="0" x2="500" y2="500" /> {/* prime meridian */}
        <line x1="250" y1="0" x2="250" y2="500" />
        <line x1="750" y1="0" x2="750" y2="500" />
      </g>
    </svg>
  );
}

function PulseHotspot({
  hotspot,
  isActive,
  onClick,
}: {
  hotspot: CountryHotspot;
  isActive: boolean;
  onClick: () => void;
}) {
  const intensity = Math.min(1, hotspot.articles / 10);
  const hasBreaking = hotspot.breaking > 0;
  const baseColor = hasBreaking ? "#E63946" : "#FF6B00";

  return (
    <button
      onClick={onClick}
      className="absolute z-10 group"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: "translate(-50%, -50%)" }}
    >
      {/* Heatmap glow — Snapchat-style radial gradient */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 60 + intensity * 40,
          height: 60 + intensity * 40,
          marginLeft: -(30 + intensity * 20),
          marginTop: -(30 + intensity * 20),
          background: `radial-gradient(circle, ${baseColor}${hasBreaking ? "25" : "18"} 0%, ${baseColor}08 40%, transparent 70%)`,
          filter: `blur(${4 + intensity * 6}px)`,
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.5, 0.8] }}
        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pulse rings */}
      {hasBreaking && (
        <>
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: 36, height: 36, marginLeft: -18, marginTop: -18,
              borderColor: `${baseColor}30`,
            }}
            animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: 36, height: 36, marginLeft: -18, marginTop: -18,
              borderColor: `${baseColor}20`,
            }}
            animate={{ scale: [1, 3], opacity: [0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Core dot */}
      <motion.div
        className="relative w-3 h-3 rounded-full cursor-pointer"
        style={{
          backgroundColor: baseColor,
          boxShadow: `0 0 ${10 + intensity * 15}px ${baseColor}90`,
        }}
        whileHover={{ scale: 2 }}
        animate={isActive ? { scale: [1, 1.5, 1] } : {}}
        transition={isActive ? { duration: 0.6, repeat: Infinity } : {}}
      />

      {/* Label tooltip */}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
        <div className="px-2.5 py-1 rounded-lg bg-[#08080d]/95 border border-white/10 backdrop-blur-md shadow-xl">
          <span className="text-[10px] font-heading text-white font-medium">
            {hotspot.flag} {hotspot.label}
          </span>
          {hotspot.breaking > 0 && (
            <span className="text-[9px] text-red-400 ml-1.5">{hotspot.breaking} breaking</span>
          )}
        </div>
        <div className="w-2 h-2 bg-[#08080d]/95 border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
      </div>
    </button>
  );
}

export default function NewsPulseMap() {
  const [hotspots, setHotspots] = useState<CountryHotspot[]>([]);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllCountries() {
      setLoading(true);
      const countries = Object.keys(COUNTRY_POSITIONS);
      const results = await Promise.allSettled(
        countries.map(async (code) => {
          const res = await fetch(`/api/news?category=general&country=${code}&lang=en&max=3`);
          const data = await res.json();
          const pos = COUNTRY_POSITIONS[code];
          const meta = COUNTRY_META[code];
          const oneHourAgo = Date.now() - 3600000;
          const breaking = (data.articles || []).filter(
            (a: { publishedAt: string }) => new Date(a.publishedAt).getTime() > oneHourAgo
          ).length;
          return {
            code, label: meta.label, flag: meta.flag,
            x: pos.x, y: pos.y,
            articles: data.totalArticles || data.articles?.length || 0,
            breaking,
            topHeadline: data.articles?.[0]?.title || null,
          };
        })
      );
      const spots: CountryHotspot[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") spots.push(r.value);
      }
      setHotspots(spots);
      setLoading(false);
    }
    fetchAllCountries();
    const interval = setInterval(fetchAllCountries, 120000);
    return () => clearInterval(interval);
  }, []);

  const activeHotspot = hotspots.find((h) => h.code === activeCountry);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-chakra-orange/10 border border-chakra-orange/20 flex items-center justify-center">
          <IconMapPin size={16} className="text-chakra-orange" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-white">News Pulse Map</h2>
          <p className="text-[11px] text-mist-gray/40">Live global heatmap — tap hotspots to explore</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[10px] font-mono text-mist-gray/30">LIVE</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative w-full aspect-[2/1] rounded-2xl border border-white/[0.06] bg-[#04040a] overflow-hidden">
        <WorldSVG />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <motion.div className="text-xs font-heading text-mist-gray/30" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Scanning global feeds...
            </motion.div>
          </div>
        )}

        {hotspots.map((h) => (
          <PulseHotspot
            key={h.code}
            hotspot={h}
            isActive={activeCountry === h.code}
            onClick={() => setActiveCountry(activeCountry === h.code ? null : h.code)}
          />
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {activeHotspot && (
          <motion.div
            className="mt-4 rounded-xl border border-white/[0.06] bg-[#0a0a10]/80 backdrop-blur-sm overflow-hidden"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <div className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeHotspot.flag}</span>
                  <span className="font-heading font-bold text-white">{activeHotspot.label}</span>
                  <span className="text-xs font-mono text-mist-gray/40">{activeHotspot.articles} stories</span>
                  {activeHotspot.breaking > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        <IconCircleFilled size={6} className="text-red-400" />
                      </motion.div>
                      <span className="text-[10px] font-heading text-red-400">{activeHotspot.breaking} breaking</span>
                    </span>
                  )}
                </div>
                <Link
                  href="/trending"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-chakra-orange/10 border border-chakra-orange/20 text-xs font-heading text-chakra-orange hover:bg-chakra-orange/20 transition-all"
                >
                  Explore <IconArrowRight size={12} />
                </Link>
              </div>
              {activeHotspot.topHeadline && (
                <p className="text-sm text-mist-gray/60 line-clamp-2">{activeHotspot.topHeadline}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(230,57,70,0.5)]" />
          <span className="text-[10px] text-mist-gray/30">Breaking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-chakra-orange shadow-[0_0_6px_rgba(255,107,0,0.4)]" />
          <span className="text-[10px] text-mist-gray/30">Active</span>
        </div>
        <span className="text-[10px] text-mist-gray/20 ml-auto">Refreshes every 2 min</span>
      </div>
    </section>
  );
}
