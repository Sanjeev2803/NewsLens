"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Article {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#2DC653",
  negative: "#E63946",
  neutral: "#00B4D8",
};

const SEAL_FILTERS = [
  { label: "All", icon: "☰", category: "general" },
  { label: "Tech", icon: "⚡", category: "technology" },
  { label: "World", icon: "🌐", category: "world" },
  { label: "Sports", icon: "⚽", category: "sports" },
  { label: "Entertainment", icon: "🎬", category: "entertainment" },
  { label: "Science", icon: "🔬", category: "science" },
  { label: "Business", icon: "📊", category: "business" },
  { label: "Health", icon: "🏥", category: "health" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ScrollCard({
  article,
  index,
  inView,
  isItachi,
  hoveredId,
  onHover,
  onLeave,
}: {
  article: Article;
  index: number;
  inView: boolean;
  isItachi: boolean;
  hoveredId: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const cardBg = isItachi ? "bg-ink-black/60" : "bg-[#F5E6C8]/80";
  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";
  const id = article.url;
  const sentiment = "neutral"; // could be computed via AI later
  const power = Math.floor(50 + Math.random() * 50); // placeholder power level

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex-shrink-0 w-72 md:w-80 rounded-lg border backdrop-blur-sm snap-start cursor-pointer transition-all overflow-hidden ${cardBg} ${
        isItachi ? "border-mist-gray/10" : "border-[#8B0000]/10"
      }`}
      style={{ borderLeft: `3px solid ${SENTIMENT_COLORS[sentiment]}` }}
      initial={{ opacity: 0, x: 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={onLeave}
    >
      {/* Image */}
      {article.image && !imgError ? (
        <div className="relative w-full h-28 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-shadow-dark/70 text-[10px] font-mono text-mist-gray backdrop-blur-sm">
            {timeAgo(article.publishedAt)}
          </div>
        </div>
      ) : (
        <div className={`relative w-full h-20 flex items-center justify-end pr-4 ${isItachi ? "bg-ink-black/40" : "bg-[#e8d5b0]"}`}>
          <span className={`text-[10px] font-mono ${textSecondary}`}>{timeAgo(article.publishedAt)}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-mono ${textSecondary}`}>{article.source.name}</span>
        </div>
        <h3 className={`text-sm font-heading font-semibold leading-snug mb-3 line-clamp-2 ${textPrimary}`}>
          {article.title}
        </h3>

        {/* Power bar */}
        <div className="relative h-1.5 rounded-full bg-mist-gray/20 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${SENTIMENT_COLORS[sentiment]}, ${
                isItachi ? "#E63946" : "#FF6B00"
              })`,
            }}
            initial={{ width: 0 }}
            animate={inView ? { width: `${power}%` } : {}}
            transition={{ duration: 1, delay: 0.4 + index * 0.08, ease: "easeOut" }}
          />
        </div>
        <span className={`text-[10px] font-mono mt-1 block ${textSecondary}`}>
          Power Level: {power}
        </span>

        {/* Summary on hover */}
        <motion.div
          initial={false}
          animate={{ height: hoveredId === id ? "auto" : 0, opacity: hoveredId === id ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <p className={`text-xs mt-2 pt-2 border-t line-clamp-3 ${textSecondary} ${
            isItachi ? "border-mist-gray/10" : "border-[#8B0000]/10"
          }`}>
            {article.description}
          </p>
        </motion.div>
      </div>
    </motion.a>
  );
}

export default function BreakingScrolls() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { isItachi } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeCategory, setActiveCategory] = useState("general");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${activeCategory}&country=in&lang=en&max=5`);
        const data = await res.json();
        if (data.articles) setArticles(data.articles);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  return (
    <section ref={ref} className="w-full py-12 px-6 overflow-hidden">
      <motion.h2
        className={`text-2xl md:text-3xl font-heading font-bold text-center mb-2 ${textPrimary}`}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        Breaking Scrolls
      </motion.h2>
      <motion.p
        className={`text-sm text-center mb-8 ${textSecondary}`}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
      >
        Live trending intelligence — auto-refreshes every minute
      </motion.p>

      {/* Category filters */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-8 flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
      >
        {SEAL_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => { setActiveFilter(f.label); setActiveCategory(f.category); }}
            className={`relative px-3 py-1.5 rounded-md text-sm font-heading font-medium transition-all ${
              activeFilter === f.label
                ? isItachi
                  ? "bg-sharingan-red/20 text-sharingan-red"
                  : "bg-chakra-orange/20 text-chakra-orange"
                : `${textSecondary} hover:${textPrimary}`
            }`}
          >
            <span className="mr-1">{f.icon}</span>
            {f.label}
            {activeFilter === f.label && (
              <motion.div
                layoutId="filter-glow"
                className={`absolute inset-0 rounded-md ${
                  isItachi ? "shadow-[0_0_12px_rgba(230,57,70,0.3)]" : "shadow-[0_0_12px_rgba(255,107,0,0.3)]"
                }`}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* Scrolling news cards */}
      <div className="relative">
        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-shrink-0 w-72 md:w-80 h-64 rounded-lg bg-ink-black/30 border border-mist-gray/5"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {articles.map((article, i) => (
              <ScrollCard
                key={article.url}
                article={article}
                index={i}
                inView={inView}
                isItachi={isItachi}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onLeave={() => setHoveredId(null)}
              />
            ))}
          </div>
        ) : (
          <p className={`text-center text-sm ${textSecondary}`}>
            No news available — add your GNews API key to .env.local
          </p>
        )}
      </div>
    </section>
  );
}
