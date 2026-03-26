"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import {
  IconLayoutGrid,
  IconCpu,
  IconWorld,
  IconBallFootball,
  IconMovie,
  IconFlask,
  IconChartBar,
  IconHeartbeat,
  IconTrendingUp,
  IconArrowRight,
  IconBolt,
  IconCircleFilled,
  IconVolume,
} from "@tabler/icons-react";

interface Article {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

interface TrendingTopic {
  title: string;
  traffic: string;
  url: string;
}

const CATEGORIES = [
  { label: "All", icon: IconLayoutGrid, id: "general" },
  { label: "Tech", icon: IconCpu, id: "technology" },
  { label: "World", icon: IconWorld, id: "world" },
  { label: "Sports", icon: IconBallFootball, id: "sports" },
  { label: "Entertainment", icon: IconMovie, id: "entertainment" },
  { label: "Science", icon: IconFlask, id: "science" },
  { label: "Business", icon: IconChartBar, id: "business" },
  { label: "Health", icon: IconHeartbeat, id: "health" },
];

function getRankLabel(publishedAt: string): { text: string; color: string; bg: string } {
  const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (hours < 1) return { text: "BREAKING", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
  if (hours < 3) return { text: "FRESH", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" };
  if (hours < 12) return { text: "RECENT", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
  return { text: "EARLIER", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" };
}

/* ── FEATURED HERO CARD ── */
function FeaturedStory({ article }: { article: Article }) {
  const [imgErr, setImgErr] = useState(false);
  const rank = getRankLabel(article.publishedAt);

  return (
    <Link href="/trending" className="group block">
      <motion.div
        className="relative w-full aspect-[2.2/1] md:aspect-[2.8/1] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Image */}
        {article.image && !imgErr ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgErr(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/60 to-[#08080d]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08080d]/70 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1028] via-[#12121f] to-[#08080d]">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
              <IconBolt size={120} />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,57,70,0.06)_0%,transparent_70%)]" />
          </div>
        )}

        {/* Live badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md ${rank.bg}`}>
            {rank.text === "BREAKING" && (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <IconCircleFilled size={6} className="text-red-400" />
              </motion.div>
            )}
            <span className={`text-[10px] font-heading font-bold tracking-widest ${rank.color}`}>{rank.text}</span>
          </div>
          <span className="text-[11px] font-mono text-white/30 backdrop-blur-sm">{timeAgo(article.publishedAt)}</span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-heading text-chakra-orange/80 font-medium">{article.source.name}</span>
          </div>
          <h2 className="text-xl md:text-3xl font-heading font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
            {article.title}
          </h2>
          <p className="text-sm text-mist-gray/60 line-clamp-2 max-w-2xl mb-4 hidden md:block">
            {article.description}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-chakra-orange/60 transition-colors">
            <span className="font-heading">Read full story</span>
            <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-chakra-orange/0 to-transparent group-hover:via-chakra-orange/40 transition-all duration-500" />
      </motion.div>
    </Link>
  );
}

/* ── STORY CARD (Grid) ── */
function StoryCard({ article, index }: { article: Article; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const rank = getRankLabel(article.publishedAt);

  return (
    <Link href="/trending">
      <motion.div
        className="group relative flex flex-col rounded-xl overflow-hidden border border-white/[0.04] bg-[#0a0a10]/80 hover:border-white/[0.1] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all cursor-pointer h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 + index * 0.06 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {article.image && !imgErr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={() => setImgErr(true)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a10] via-transparent to-transparent opacity-80" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1028] via-[#12121f] to-[#0a0a10] flex items-center justify-center">
              <IconBolt size={28} className="text-white/[0.06]" />
            </div>
          )}
          <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md border backdrop-blur-sm ${rank.bg}`}>
            <span className={`text-[8px] font-heading font-bold tracking-widest ${rank.color}`}>{rank.text}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-heading text-chakra-orange/60 font-medium">{article.source.name}</span>
            <span className="text-[10px] font-mono text-mist-gray/30">{timeAgo(article.publishedAt)}</span>
          </div>
          <h3 className="text-[13px] font-heading font-semibold text-white/90 leading-snug line-clamp-2 mb-2 group-hover:text-chakra-orange transition-colors duration-300">
            {article.title}
          </h3>
          <p className="text-[11px] text-mist-gray/60 leading-relaxed line-clamp-2 mt-auto">
            {article.description}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-chakra-orange/20 transition-all duration-500" />
      </motion.div>
    </Link>
  );
}

/* ── TRENDING TICKER ── */
function TrendingTicker({ topics }: { topics: TrendingTopic[] }) {
  if (topics.length === 0) return null;

  return (
    <motion.div
      className="rounded-xl border border-chakra-orange/8 bg-[#0a0a10]/50 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="px-4 py-2.5 border-b border-chakra-orange/6 flex items-center gap-2">
        <IconTrendingUp size={16} className="text-chakra-orange" />
        <span className="text-xs font-heading font-bold text-chakra-orange tracking-wider">TRENDING NOW</span>
        <span className="text-[10px] text-mist-gray/30 ml-auto font-mono">Google Trends</span>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
        {topics.map((t, i) => (
          <a
            key={`${t.title}-${i}`}
            href={t.url || `https://www.google.com/search?q=${encodeURIComponent(t.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-xs font-heading text-white/70 hover:bg-chakra-orange/10 hover:border-chakra-orange/20 hover:text-white transition-all"
          >
            <span className="text-chakra-orange/60 mr-1.5 font-mono">#{i + 1}</span>
            {t.title}
            {t.traffic && <span className="ml-1.5 text-[10px] text-mist-gray/30">{t.traffic}</span>}
          </a>
        ))}
      </div>
    </motion.div>
  );
}

/* ── MAIN COMPONENT ── */

interface BreakingScrollsProps {
  initialArticles?: Article[];
  initialTrending?: TrendingTopic[];
  initialFreshCount?: number;
  initialSourceCount?: number;
}

export default function BreakingScrolls({
  initialArticles,
  initialTrending,
  initialFreshCount,
  initialSourceCount,
}: BreakingScrollsProps = {}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [activeCategory, setActiveCategory] = useState("general");
  const [articles, setArticles] = useState<Article[]>(initialArticles || []);
  const [trending, setTrending] = useState<TrendingTopic[]>(initialTrending || []);
  const [loading, setLoading] = useState(!initialArticles);
  const [freshCount, setFreshCount] = useState(initialFreshCount || 0);
  const [sourceCount, setSourceCount] = useState(initialSourceCount || 0);

  useEffect(() => {
    // Skip initial fetch if we have server-provided data and category hasn't changed
    let skipFirst = activeCategory === "general" && !!initialArticles;

    async function fetchNews() {
      if (skipFirst) { skipFirst = false; return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${activeCategory}&country=in&lang=en&max=9`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.articles) setArticles(data.articles);
        if (data.trending) setTrending(data.trending);
        if (data.freshCount != null) setFreshCount(data.freshCount);
        if (data.sources) setSourceCount(data.sources.length);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [activeCategory, initialArticles]);

  const featured = articles[0];
  const grid = articles.slice(1, 7);

  return (
    <section ref={ref} className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-16">

      {/* ── STATUS BAR ── */}
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-2 h-2 rounded-full bg-sage-green"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-heading text-sage-green">Live</span>
          </div>
          {freshCount > 0 && (
            <span className="text-[11px] font-mono text-mist-gray/40">{freshCount} breaking</span>
          )}
          {sourceCount > 0 && (
            <span className="text-[11px] font-mono text-mist-gray/30">{sourceCount} sources</span>
          )}
        </div>
        <span className="text-[10px] font-mono text-mist-gray/20">Auto-refreshes every 60s</span>
      </motion.div>

      {/* ── CATEGORY PILLS ── */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.15 }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all border ${
              activeCategory === cat.id
                ? "bg-white/[0.06] text-white border-white/[0.12] shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                : "bg-transparent text-mist-gray/50 border-white/[0.03] hover:text-white/70 hover:border-white/[0.08]"
            }`}
          >
            <cat.icon size={15} stroke={1.5} />
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* ── TRENDING TICKER ── */}
      {trending.length > 0 && (
        <div className="mb-6">
          <TrendingTicker topics={trending.slice(0, 10)} />
        </div>
      )}

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Featured skeleton */}
            <motion.div
              className="w-full aspect-[2.8/1] rounded-2xl bg-white/[0.02] border border-white/[0.04]"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden"
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                >
                  <div className="aspect-[16/9] bg-white/[0.02]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-20 rounded bg-white/[0.04]" />
                    <div className="h-4 w-full rounded bg-white/[0.03]" />
                    <div className="h-4 w-3/4 rounded bg-white/[0.025]" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : articles.length > 0 ? (
          <motion.div
            key={`feed-${activeCategory}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Featured story */}
            {featured && <FeaturedStory article={featured} />}

            {/* Grid */}
            {grid.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grid.map((article, i) => (
                  <StoryCard key={article.url} article={article} index={i} />
                ))}
              </div>
            )}

            {/* CTA */}
            <motion.div
              className="flex justify-center pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/trending"
                className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <span className="text-sm font-heading text-white/60 group-hover:text-white transition-colors">
                  View all stories on Dashboard
                </span>
                <IconArrowRight size={16} className="text-white/30 group-hover:text-chakra-orange group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <IconBolt size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-mist-gray/40 font-heading">No stories found</p>
            <p className="text-mist-gray/20 text-sm mt-1">Try a different category or check back soon</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
