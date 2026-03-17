"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconEye, IconBrandReddit, IconBrandYoutube, IconWorld, IconBook, IconRefresh, IconExternalLink } from "@tabler/icons-react";

/*
  Perspective Lens — Multi-platform story comparison
  Pick a trending topic → instantly see how Reddit, YouTube, Bluesky, and Wikipedia
  cover the same topic. Shows different angles on the same story.

  No other news aggregator does this.
*/

interface PlatformView {
  platform: string;
  icon: typeof IconBrandReddit;
  color: string;
  title: string;
  text: string;
  url: string;
  score: number;
  author: string;
}

interface TopicData {
  topic: string;
  views: PlatformView[];
}

const PLATFORM_CONFIG = {
  reddit: { icon: IconBrandReddit, color: "#FF4500", label: "Reddit" },
  youtube: { icon: IconBrandYoutube, color: "#FF0000", label: "YouTube" },
  bluesky: { icon: IconWorld, color: "#0085FF", label: "Bluesky" },
  wikipedia: { icon: IconBook, color: "#636466", label: "Wikipedia" },
};

function PlatformCard({ view, index }: { view: PlatformView; index: number }) {
  const config = PLATFORM_CONFIG[view.platform as keyof typeof PLATFORM_CONFIG] || PLATFORM_CONFIG.reddit;
  const Icon = config.icon;

  return (
    <motion.a
      href={view.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-xl border border-white/[0.04] bg-[#0a0a10]/80 hover:border-white/[0.1] transition-all overflow-hidden h-full"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
    >
      {/* Platform header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]" style={{ backgroundColor: `${config.color}08` }}>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon size={14} style={{ color: config.color }} />
        </div>
        <span className="text-xs font-heading font-semibold" style={{ color: config.color }}>{config.label}</span>
        {view.score > 0 && (
          <span className="ml-auto text-[10px] font-mono text-mist-gray/40">
            {view.score > 1000 ? `${(view.score / 1000).toFixed(1)}k` : view.score}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <h4 className="text-[13px] font-heading font-semibold text-white/85 leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
          {view.title}
        </h4>
        <p className="text-[11px] text-mist-gray/40 leading-relaxed line-clamp-3">
          {view.text}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-white/[0.03]">
        <span className="text-[10px] text-mist-gray/30 truncate max-w-[60%]">{view.author}</span>
        <IconExternalLink size={12} className="text-mist-gray/20 group-hover:text-white/40 transition-colors" />
      </div>

      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${config.color}40, transparent)` }}
      />
    </motion.a>
  );
}

export default function PerspectiveLens() {
  const [topics, setTopics] = useState<string[]>([]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [views, setViews] = useState<PlatformView[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch trending topics on mount
  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/news?category=general&country=in&lang=en&max=5");
        const data = await res.json();
        const headlines = (data.articles || [])
          .slice(0, 5)
          .map((a: { title: string }) => a.title)
          .filter(Boolean);
        setTopics(headlines);
        if (headlines.length > 0 && !activeTopic) {
          loadPerspectives(headlines[0]);
        }
      } catch {
        // silent
      } finally {
        setInitialLoad(false);
      }
    }
    fetchTopics();
  }, []);

  async function loadPerspectives(topic: string) {
    setActiveTopic(topic);
    setLoading(true);
    setViews([]);

    try {
      // Fetch social data — the API already has Reddit, Bluesky, YouTube, Wikipedia
      const res = await fetch(`/api/social?country=in&lang=en&category=general`);
      const data = await res.json();
      const posts = data.posts || [];

      // Find posts related to this topic (keyword match)
      const keywords = topic.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 4);

      const matchedViews: PlatformView[] = [];
      const seenPlatforms = new Set<string>();

      // First pass: find related posts
      for (const post of posts) {
        if (seenPlatforms.has(post.platform)) continue;
        const postText = `${post.title} ${post.text}`.toLowerCase();
        const matches = keywords.filter((kw: string) => postText.includes(kw)).length;
        if (matches >= 1) {
          const config = PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG];
          if (config) {
            matchedViews.push({
              platform: post.platform,
              icon: config.icon,
              color: config.color,
              title: post.title,
              text: post.text || post.title,
              url: post.url,
              score: post.score || 0,
              author: post.author || config.label,
            });
            seenPlatforms.add(post.platform);
          }
        }
      }

      // Second pass: fill missing platforms with top posts
      for (const post of posts) {
        if (seenPlatforms.has(post.platform)) continue;
        if (matchedViews.length >= 4) break;
        const config = PLATFORM_CONFIG[post.platform as keyof typeof PLATFORM_CONFIG];
        if (config) {
          matchedViews.push({
            platform: post.platform,
            icon: config.icon,
            color: config.color,
            title: post.title,
            text: post.text || post.title,
            url: post.url,
            score: post.score || 0,
            author: post.author || config.label,
          });
          seenPlatforms.add(post.platform);
        }
      }

      setViews(matchedViews.slice(0, 4));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (initialLoad) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-rasengan-blue/10 border border-rasengan-blue/20 flex items-center justify-center">
          <IconEye size={16} className="text-rasengan-blue" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-white">Perspective Lens</h2>
          <p className="text-[11px] text-mist-gray/40">Same story, different platforms — see every angle</p>
        </div>
      </div>

      {/* Topic selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {topics.map((topic, i) => (
          <button
            key={i}
            onClick={() => loadPerspectives(topic)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-heading transition-all border max-w-[280px] text-left ${
              activeTopic === topic
                ? "bg-rasengan-blue/10 text-white border-rasengan-blue/25"
                : "bg-transparent text-mist-gray/50 border-white/[0.04] hover:text-white/70 hover:border-white/[0.08]"
            }`}
          >
            <span className="line-clamp-1">{topic}</span>
          </button>
        ))}
        {topics.length > 0 && (
          <button
            onClick={() => {
              const next = topics[(topics.indexOf(activeTopic || "") + 1) % topics.length];
              if (next) loadPerspectives(next);
            }}
            className="flex-shrink-0 w-9 h-9 rounded-xl border border-white/[0.04] flex items-center justify-center text-mist-gray/30 hover:text-white/60 hover:border-white/[0.08] transition-all"
          >
            <IconRefresh size={14} />
          </button>
        )}
      </div>

      {/* Platform perspectives grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-white/[0.04] bg-white/[0.015] overflow-hidden"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              >
                <div className="h-12 bg-white/[0.02] border-b border-white/[0.03]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-full rounded bg-white/[0.03]" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.025]" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.02]" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : views.length > 0 ? (
          <motion.div
            key={activeTopic}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {views.map((view, i) => (
              <PlatformCard key={`${view.platform}-${i}`} view={view} index={i} />
            ))}
          </motion.div>
        ) : activeTopic ? (
          <motion.div
            key="empty"
            className="text-center py-12 rounded-xl border border-white/[0.04] bg-white/[0.01]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <IconEye size={32} className="mx-auto mb-3 text-white/10" />
            <p className="text-sm text-mist-gray/40">No multi-platform perspectives found for this story</p>
            <p className="text-xs text-mist-gray/20 mt-1">Try another headline above</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
