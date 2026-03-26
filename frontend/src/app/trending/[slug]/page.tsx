"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { timeAgo } from "@/lib/utils";
import type { Article, TrendingTopic, SocialPost } from "@/types/news";

/* ── Platform icon SVGs ── */
function NewspaperIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M4 4h16a1 1 0 011 1v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a1 1 0 011-1z" />
      <path d="M7 8h10M7 12h6M7 16h8" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm6.67-10.5a1.46 1.46 0 00-2.47-1 7.12 7.12 0 00-3.85-1.23l.65-3.08 2.13.45a1.04 1.04 0 102.08 0 1.04 1.04 0 10-1.95-.38l-2.38-.5a.29.29 0 00-.34.23l-.72 3.44a7.14 7.14 0 00-3.9 1.23 1.46 1.46 0 10-1.6 2.39 2.86 2.86 0 000 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.86 2.86 0 000-.44 1.46 1.46 0 00.6-1.39zM9.17 13.5a1.04 1.04 0 110-2.08 1.04 1.04 0 010 2.08zm5.72 2.83a3.58 3.58 0 01-2.85.87 3.58 3.58 0 01-2.85-.87.28.28 0 01.4-.4c.6.54 1.5.8 2.45.8s1.85-.26 2.45-.8a.28.28 0 01.4.4zm-.06-1.79a1.04 1.04 0 110-2.08 1.04 1.04 0 010 2.08z" />
    </svg>
  );
}

function SocialIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-4.97 0-8-3.03-8-7 0-2.87 1.56-5.47 2.93-7.21.6-.76 1.23-1.43 1.72-1.92.24-.24.44-.42.57-.54.06-.06.11-.1.13-.12l.01-.01L12 3l2.64 3.2.01.01c.02.02.07.06.13.12.13.12.33.3.57.54.49.49 1.12 1.16 1.72 1.92C18.44 10.53 20 13.13 20 16c0 3.97-3.03 7-8 7zm0-16.15C10.55 8.41 7 11.85 7 16c0 2.76 2.24 4 5 4s5-1.24 5-4c0-4.15-3.55-7.59-5-9.15z" />
    </svg>
  );
}

function UpvoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  );
}

function TrendingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

/* ── Helpers ── */
function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const PLATFORM_COLORS: Record<string, { text: string; bg: string }> = {
  reddit: { text: "text-orange-400", bg: "bg-orange-500/10" },
  bluesky: { text: "text-sky-400", bg: "bg-sky-500/10" },
  youtube: { text: "text-red-400", bg: "bg-red-500/10" },
  hackernews: { text: "text-orange-300", bg: "bg-orange-400/10" },
  x: { text: "text-white/70", bg: "bg-white/[0.05]" },
  threads: { text: "text-purple-400", bg: "bg-purple-500/10" },
  wikipedia: { text: "text-gray-300", bg: "bg-gray-500/10" },
};

/* ── Feed item type for unified timeline ── */
type FeedItem =
  | { kind: "article"; data: Article; ts: number }
  | { kind: "social"; data: SocialPost; ts: number };

/* ── Card components ── */
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = article.image && !imgErr;

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-b border-white/[0.04] px-4 py-4 hover:bg-white/[0.02] transition-colors"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <NewspaperIcon className="w-4 h-4 text-rasengan-blue/60" />
        <span className="text-xs font-heading text-rasengan-blue/80 font-medium">{article.source.name}</span>
        <span className="text-[10px] text-mist-gray/30 font-mono">{timeAgo(article.publishedAt)}</span>
        <ExternalIcon className="w-3 h-3 text-white/20 ml-auto flex-shrink-0" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-heading font-semibold text-white/90 leading-snug mb-1.5">
        {article.title}
      </h3>

      {/* Description */}
      {article.description && (
        <p className="text-xs text-mist-gray/50 leading-relaxed line-clamp-2 mb-2">
          {article.description}
        </p>
      )}

      {/* Thumbnail */}
      {showImg && (
        <div className="mt-2 rounded-lg overflow-hidden border border-white/[0.04]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image!}
            alt=""
            className="w-full h-40 object-cover"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        </div>
      )}
    </motion.a>
  );
}

function SocialCard({ post, index }: { post: SocialPost; index: number }) {
  const colors = PLATFORM_COLORS[post.platform] || PLATFORM_COLORS.x;
  const PlatformIcon = post.platform === "reddit" ? RedditIcon : SocialIcon;

  return (
    <motion.a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-b border-white/[0.04] px-4 py-4 hover:bg-white/[0.02] transition-colors"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1 rounded ${colors.bg}`}>
          <PlatformIcon className={`w-3.5 h-3.5 ${colors.text}`} />
        </div>
        <span className={`text-xs font-heading font-medium capitalize ${colors.text}`}>{post.platform}</span>
        {post.author && (
          <span className="text-[11px] text-mist-gray/40 font-mono">
            {post.platform === "reddit" ? `u/${post.author}` : `@${post.author}`}
          </span>
        )}
        <span className="text-[10px] text-mist-gray/30 font-mono">{timeAgo(post.timestamp)}</span>
        <ExternalIcon className="w-3 h-3 text-white/20 ml-auto flex-shrink-0" />
      </div>

      {/* Title / Text */}
      {post.title && (
        <h3 className="text-sm font-heading font-semibold text-white/90 leading-snug mb-1">
          {post.title}
        </h3>
      )}
      {post.text && (
        <p className="text-xs text-mist-gray/50 leading-relaxed line-clamp-3 mb-2">
          {post.text}
        </p>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-1">
        {post.score > 0 && (
          <div className="flex items-center gap-1 text-mist-gray/30">
            <UpvoteIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{formatScore(post.score)}</span>
          </div>
        )}
        {post.comments != null && post.comments > 0 && (
          <div className="flex items-center gap-1 text-mist-gray/30">
            <CommentIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{post.comments}</span>
          </div>
        )}
      </div>
    </motion.a>
  );
}

/* ── Loading skeleton ── */
function FeedSkeleton() {
  return (
    <div className="divide-y divide-white/[0.04]">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="px-4 py-4 space-y-2"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/[0.04]" />
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
            <div className="h-3 w-12 rounded bg-white/[0.03]" />
          </div>
          <div className="h-4 w-full rounded bg-white/[0.03]" />
          <div className="h-4 w-3/4 rounded bg-white/[0.025]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.02]" />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function TrendDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = decodeURIComponent(resolvedParams.slug);

  const [articles, setArticles] = useState<Article[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [relatedTrends, setRelatedTrends] = useState<TrendingTopic[]>([]);
  const [traffic, setTraffic] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trends/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArticles(data.articles || []);
        setSocialPosts(data.socialPosts || []);
        setRelatedTrends(data.relatedTrends || []);
        setTraffic(data.trend?.traffic || "");
      } catch {
        setError("Could not load trend data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Build unified feed sorted by recency
  const feed: FeedItem[] = [
    ...articles.map((a) => ({
      kind: "article" as const,
      data: a,
      ts: new Date(a.publishedAt).getTime(),
    })),
    ...socialPosts.map((p) => ({
      kind: "social" as const,
      data: p,
      ts: new Date(p.timestamp).getTime(),
    })),
  ].sort((a, b) => b.ts - a.ts);

  const isEmpty = !loading && feed.length === 0 && !error;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-0 sm:px-4 pt-20 pb-16">
        {/* ── Header ── */}
        <motion.div
          className="sticky top-16 z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              aria-label="Back to Arena"
            >
              <ArrowLeftIcon className="w-5 h-5 text-white/60" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-heading font-bold text-white truncate">
                #{slug}
              </h1>
              {traffic && (
                <span className="text-[11px] font-mono text-mist-gray/40">{traffic} searches</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sharingan-red/10 border border-sharingan-red/20">
              <FireIcon className="w-4 h-4 text-sharingan-red" />
              <span className="text-[10px] font-heading font-bold text-sharingan-red tracking-wider">TRENDING</span>
            </div>
          </div>
        </motion.div>

        {/* ── Feed stats ── */}
        {!loading && !error && feed.length > 0 && (
          <motion.div
            className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span className="text-xs font-mono text-mist-gray/40">
              {articles.length} article{articles.length !== 1 ? "s" : ""}
            </span>
            <span className="text-white/10">|</span>
            <span className="text-xs font-mono text-mist-gray/40">
              {socialPosts.length} social post{socialPosts.length !== 1 ? "s" : ""}
            </span>
          </motion.div>
        )}

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FeedSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="text-center py-20 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sharingan-red/80 font-heading mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-chakra-orange/60 hover:text-chakra-orange transition-colors font-heading"
              >
                Retry
              </button>
            </motion.div>
          ) : isEmpty ? (
            <motion.div
              key="empty"
              className="text-center py-20 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TrendingIcon className="w-10 h-10 mx-auto mb-4 text-white/10" />
              <p className="text-mist-gray/50 font-heading mb-1">
                No results found for <span className="text-white/70">#{slug}</span>
              </p>
              <p className="text-mist-gray/30 text-sm">
                Try checking back later as more coverage appears.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Unified feed */}
              {feed.map((item, i) =>
                item.kind === "article" ? (
                  <ArticleCard key={`a-${item.data.url}-${i}`} article={item.data} index={i} />
                ) : (
                  <SocialCard key={`s-${item.data.url}-${i}`} post={item.data} index={i} />
                )
              )}

              {/* ── Related Trends ── */}
              {relatedTrends.length > 0 && (
                <motion.div
                  className="px-4 py-5 border-t border-white/[0.06]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-xs font-heading font-bold text-mist-gray/40 tracking-wider mb-3 uppercase">
                    Also trending
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {relatedTrends.map((t, i) => (
                      <Link
                        key={`${t.title}-${i}`}
                        href={`/trending/${encodeURIComponent(t.title)}`}
                        className="px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-xs font-heading text-white/60 hover:bg-chakra-orange/10 hover:border-chakra-orange/20 hover:text-white transition-all"
                      >
                        #{t.title}
                        {t.traffic && (
                          <span className="ml-1.5 text-[10px] text-mist-gray/30">{t.traffic}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
