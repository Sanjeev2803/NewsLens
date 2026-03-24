"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconFlame,
  IconCpu,
  IconWorld,
  IconBallFootball,
  IconMovie,
  IconFlask,
  IconChartBar,
  IconHeartbeat,
  IconTrendingUp,
  IconExternalLink,
} from "@tabler/icons-react";
import { timeAgo } from "@/lib/utils";
import { useGeoCountry } from "@/lib/useGeoCountry";

/*
  What's Hot — Shows what's viral in each category right now.
  Sports → IPL, Cricket. Entertainment → Bollywood viral. Tech → AI launches.
  Dynamic, real data. Swipeable categories.
*/

interface HotItem {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

const HOT_CATEGORIES = [
  { id: "sports", label: "Sports", icon: IconBallFootball, color: "#2DC653", tagline: "IPL, Cricket, Football" },
  { id: "entertainment", label: "Entertainment", icon: IconMovie, color: "#FF6B00", tagline: "Bollywood, OTT, Viral" },
  { id: "technology", label: "Tech", icon: IconCpu, color: "#00B4D8", tagline: "AI, Startups, Launches" },
  { id: "business", label: "Business", icon: IconChartBar, color: "#FFD700", tagline: "Markets, Stocks, Economy" },
  { id: "science", label: "Science", icon: IconFlask, color: "#7B2FBE", tagline: "Space, Discoveries, Research" },
  { id: "health", label: "Health", icon: IconHeartbeat, color: "#E63946", tagline: "Wellness, Medical, Fitness" },
  { id: "world", label: "World", icon: IconWorld, color: "#3388FF", tagline: "Geopolitics, Global Events" },
];

function HotCard({ item, index, color }: { item: HotItem; index: number; color: string }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      {/* Rank number */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-heading font-bold"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-heading font-semibold text-white/85 leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-mist-gray/40">{item.source.name}</span>
          <span className="text-[10px] text-mist-gray/25">{timeAgo(item.publishedAt)}</span>
        </div>
      </div>

      {/* Thumbnail */}
      {item.image && !imgErr && (
        <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        </div>
      )}

      <IconExternalLink size={12} className="flex-shrink-0 text-mist-gray/15 group-hover:text-white/30 transition-colors mt-1" />
    </motion.a>
  );
}

export default function WhatsHot() {
  const country = useGeoCountry("in");
  const [activeCategory, setActiveCategory] = useState("sports");
  const [items, setItems] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchHot() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/news?category=${activeCategory}&country=${country}&lang=en&max=5`);
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setItems(data.articles || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchHot();
  }, [activeCategory, country]);

  const activeCat = HOT_CATEGORIES.find((c) => c.id === activeCategory) || HOT_CATEGORIES[0];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <IconFlame size={16} className="text-orange-400" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-white">What&apos;s Hot</h2>
          <p className="text-[11px] text-mist-gray/40">Viral right now in every category</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-5 scrollbar-hide">
        {HOT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-heading transition-all border ${
                isActive
                  ? "text-white border-white/[0.12]"
                  : "text-mist-gray/40 border-white/[0.03] hover:text-white/60 hover:border-white/[0.06]"
              }`}
              style={isActive ? { backgroundColor: `${cat.color}12`, borderColor: `${cat.color}30` } : {}}
            >
              <Icon size={15} stroke={1.5} style={isActive ? { color: cat.color } : {}} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category tagline */}
      <motion.div
        key={activeCat.id}
        className="flex items-center gap-2 mb-4 px-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <IconTrendingUp size={14} style={{ color: activeCat.color }} />
        <span className="text-xs font-heading text-mist-gray/50">{activeCat.tagline}</span>
      </motion.div>

      {/* Hot items list */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex gap-3 p-3 rounded-xl border border-white/[0.04]"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.03]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full rounded bg-white/[0.03]" />
                  <div className="h-3 w-1/3 rounded bg-white/[0.02]" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : items.length > 0 ? (
          <motion.div
            key={activeCategory}
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {items.map((item, i) => (
              <HotCard key={item.url} item={item} index={i} color={activeCat.color} />
            ))}
          </motion.div>
        ) : (
          <motion.p key="empty" className="text-center py-8 text-mist-gray/30 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error ? "Failed to load stories — try again later" : "No hot stories right now — check back soon"}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
