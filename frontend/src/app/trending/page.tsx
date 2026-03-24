"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Article, TrendingTopic, SocialPost, ApiResponse, SocialResponse } from "@/types/news";
import SharinganEye from "@/components/trending/SharinganEye";
import CrowBackground from "@/components/trending/CrowBackground";
import SharinganLoader from "@/components/trending/SharinganLoader";
import FeaturedCard from "@/components/trending/FeaturedCard";
import ArticleReader from "@/components/trending/ArticleReader";
import TrendingBar from "@/components/trending/TrendingBar";
import SocialPulse from "@/components/trending/SocialPulse";
import NewsTimeline from "@/components/trending/NewsTimeline";
import NarutoChatbot from "@/components/trending/NarutoChatbot";
import { COUNTRIES, LANGUAGES, CATEGORIES } from "@/components/trending/constants";
import { useGeoCountry } from "@/lib/useGeoCountry";

export default function TrendingPage() {
  const geoCountry = useGeoCountry("in");
  const [country, setCountry] = useState(geoCountry);
  const [userChangedCountry, setUserChangedCountry] = useState(false);
  const [lang, setLang] = useState("en");
  const [category, setCategory] = useState("general");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [freshCount, setFreshCount] = useState(0);
  const [showCountries, setShowCountries] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [readerArticle, setReaderArticle] = useState<Article | null>(null);
  const speakRef = useRef<((text: string) => void) | null>(null);

  // Sync geo-detected country on first load (not if user manually changed)
  useEffect(() => {
    if (!userChangedCountry && geoCountry !== country) {
      setCountry(geoCountry);
    }
  }, [geoCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNews = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/news?category=${category}&country=${country}&lang=${lang}&max=12`);
      if (!res.ok) { setError(`Server error (${res.status}). Try again.`); setLoading(false); return; }
      const data: ApiResponse = await res.json();
      if (data.error) { setError(data.error); setArticles([]); }
      else { setArticles(data.articles || []); setFreshCount(data.freshCount || 0); setActiveSources(data.sources || []); setTrending(data.trending || []); setRegion(data.region || null); }
    } catch { setError("Failed to fetch news. Check your connection."); }
    finally { setLoading(false); }
  }, [category, country, lang]);

  const fetchSocial = useCallback(async () => {
    try {
      const res = await fetch(`/api/social?country=${country}&lang=${lang}&category=${category}`);
      if (!res.ok) return;
      const data: SocialResponse = await res.json();
      setSocialPosts(data.posts || []);
      setSocialPlatforms(data.platforms || []);
    } catch { /* social is supplementary — silent fallback */ }
  }, [country, lang, category]);

  useEffect(() => { fetchNews(); fetchSocial(); }, [fetchNews, fetchSocial]);
  useEffect(() => { const iv = setInterval(() => { fetchNews(); fetchSocial(); }, 60000); return () => clearInterval(iv); }, [fetchNews, fetchSocial]);

  const handleVoiceRead = useCallback((text: string) => { speakRef.current?.(text); }, []);
  const activeCountry = COUNTRIES.find((c) => c.code === country);
  const activeLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <Navbar />
      <CrowBackground />

      <main id="main-content" className="relative z-10 min-h-screen pt-20 px-4 md:px-6 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center justify-center gap-5 mb-3">
              <SharinganEye size={36} spin glow className="hidden md:block" />
              <h1 className="font-brand text-3xl md:text-5xl text-gradient-orange">Trending Battleground</h1>
              <SharinganEye size={36} spin glow className="hidden md:block" />
            </div>
            <p className="text-mist-gray/50 font-heading text-sm md:text-base tracking-wide">Live intelligence — auto-refreshes every minute</p>

            {region && (
              <motion.div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full bg-amaterasu-purple/10 border border-amaterasu-purple/15" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <SharinganEye size={12} />
                <span className="text-xs font-heading text-amaterasu-purple font-medium">Showing news from {region}</span>
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {freshCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-green/8 border border-sage-green/15">
                  <motion.div className="w-2 h-2 rounded-full bg-sage-green" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  <span className="text-xs font-heading text-sage-green">{freshCount} breaking in the last hour</span>
                </div>
              )}
              {activeSources.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rasengan-blue/8 border border-rasengan-blue/15">
                  <span className="text-xs font-heading text-rasengan-blue">{activeSources.length} sources active</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div className="flex flex-wrap items-center gap-3 mb-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {/* Country */}
            <div className="relative">
              <button onClick={() => { setShowCountries(!showCountries); setShowLanguages(false); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm font-heading text-scroll-cream hover:border-sharingan-red/20 transition-all">
                <span>{activeCountry?.flag}</span><span>{activeCountry?.label}</span>
                <svg className={`w-3 h-3 transition-transform ${showCountries ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3" /></svg>
              </button>
              <AnimatePresence>
                {showCountries && (
                  <motion.div className="absolute top-full mt-1 left-0 z-50 w-48 max-h-64 overflow-y-auto rounded-xl bg-[#0c0c14]/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {COUNTRIES.map((c) => (
                      <button key={c.code} onClick={() => { setCountry(c.code); setUserChangedCountry(true); setShowCountries(false); }}
                        className={`w-full px-3 py-2 text-left text-sm font-heading flex items-center gap-2 hover:bg-white/[0.04] transition-colors ${country === c.code ? "text-chakra-orange" : "text-scroll-cream/80"}`}>
                        <span>{c.flag}</span> {c.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language */}
            <div className="relative">
              <button onClick={() => { setShowLanguages(!showLanguages); setShowCountries(false); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm font-heading text-scroll-cream hover:border-sharingan-red/20 transition-all">
                <span>{activeLang?.label}</span>
                {activeLang?.region && <span className="text-[10px] text-amaterasu-purple/70">({activeLang.region})</span>}
                <svg className={`w-3 h-3 transition-transform ${showLanguages ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3" /></svg>
              </button>
              <AnimatePresence>
                {showLanguages && (
                  <motion.div className="absolute top-full mt-1 left-0 z-50 w-56 max-h-72 overflow-y-auto rounded-xl bg-[#0c0c14]/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.6)] py-1" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {LANGUAGES.map((l) => (
                      <button key={l.code} onClick={() => { setLang(l.code); setShowLanguages(false); }}
                        className={`w-full px-3 py-2 text-left text-sm font-heading hover:bg-white/[0.04] transition-colors flex items-center justify-between ${lang === l.code ? "text-chakra-orange" : "text-scroll-cream/80"}`}>
                        <span>{l.label}</span>
                        {l.region && <span className="text-[10px] text-mist-gray/40">{l.region}</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Translate Page */}
            <button onClick={() => window.open(`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(window.location.href)}`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rasengan-blue/6 border border-rasengan-blue/12 text-xs font-heading text-rasengan-blue hover:bg-rasengan-blue/12 transition-all">
              Translate Page
            </button>

            {/* Refresh */}
            <button onClick={fetchNews} disabled={loading}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sage-green/6 border border-sage-green/12 text-xs font-heading text-sage-green hover:bg-sage-green/12 transition-all disabled:opacity-50">
              <motion.svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                animate={loading ? { rotate: 360 } : {}} transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                <path d="M14 8A6 6 0 1 1 8 2" /><path d="M8 2l2.5-1L9 4" />
              </motion.svg>
              Refresh
            </button>
          </motion.div>

          {/* Categories */}
          <motion.div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-sm font-heading font-medium overflow-hidden transition-colors ${
                  category === cat.id
                    ? "bg-sharingan-red/12 text-white border border-sharingan-red/25 shadow-[0_0_15px_rgba(204,0,0,0.12)]"
                    : "bg-white/[0.02] text-mist-gray/60 border border-white/[0.04] hover:text-white hover:border-white/[0.08]"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat.label}
                {category === cat.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-sharingan-red to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          <TrendingBar topics={trending} region={region} />
          <SocialPulse posts={socialPosts} platforms={socialPlatforms} />

          {/* Error */}
          {error && (
            <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-sharingan-red/5 border border-sharingan-red/15">
                <SharinganEye size={40} glow />
                <p className="text-sm text-sharingan-red font-heading">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {loading && !error && <SharinganLoader country={country} lang={lang} category={category} />}

          {/* Unified Timeline */}
          <AnimatePresence mode="wait">
            {!loading && !error && articles.length > 0 && (
              <motion.div
                key={`news-${category}-${country}-${lang}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <FeaturedCard
                  article={articles[0]}
                  userLang={lang}
                  onVoiceRead={handleVoiceRead}
                  currentCategory={category}
                  onOpenReader={setReaderArticle}
                />
                <NewsTimeline
                  articles={articles.slice(1)}
                  socialPosts={socialPosts}
                  userLang={lang}
                  onVoiceRead={handleVoiceRead}
                  currentCategory={category}
                  onOpenReader={setReaderArticle}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty */}
          {!loading && !error && articles.length === 0 && (
            <motion.div className="text-center py-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SharinganEye size={60} className="mx-auto mb-5 opacity-20" />
              <p className="text-mist-gray/60 font-heading text-lg">No intel found for this mission.</p>
              <p className="text-mist-gray/30 text-sm mt-2">Try a different country, language, or category.</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Article Reader Modal */}
      <AnimatePresence>
        {readerArticle && (
          <ArticleReader
            article={readerArticle}
            userLang={lang}
            onVoiceRead={handleVoiceRead}
            onClose={() => setReaderArticle(null)}
          />
        )}
      </AnimatePresence>

      <NarutoChatbot lang={lang} onSpeak={(fn) => { speakRef.current = fn; }} />
      <Footer />
    </>
  );
}
