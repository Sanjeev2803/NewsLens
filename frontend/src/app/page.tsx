import { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import BreakingScrolls from "@/components/home/BreakingScrolls";
import NewsPulseMap from "@/components/home/NewsPulseMap";
import WhatsHot from "@/components/home/WhatsHot";
import PerspectiveLens from "@/components/home/PerspectiveLens";
import FeaturePeeks from "@/components/home/FeaturePeeks";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { fetchAllNews } from "@/lib/newsSources";
import { fetchGoogleTrends } from "@/lib/regionalSources";

export const metadata: Metadata = {
  title: "NewsLens — Real-Time News Intelligence",
  description:
    "Live news from 20+ sources across 12 countries. Regional Indian coverage in 10 languages. Zero API keys, zero noise.",
  openGraph: {
    title: "NewsLens — See Through the News",
    description: "Real-time news intelligence across 20+ sources. Regional depth. Zero noise.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsLens — Real-Time News Intelligence",
    description: "Live news from 20+ sources. Regional Indian coverage in 10 languages.",
  },
};

// Server-fetch initial data for instant render + SEO
async function getInitialNews() {
  try {
    const [newsResult, trends] = await Promise.all([
      fetchAllNews({ category: "general", country: "in", lang: "en", max: 15 }),
      fetchGoogleTrends("IN"),
    ]);
    return {
      articles: newsResult.articles.slice(0, 9),
      trending: trends.slice(0, 12),
      freshCount: newsResult.freshCount,
      sourceCount: newsResult.sources.length,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const initialData = await getInitialNews();

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-18">
        {/* Brand identity */}
        <HeroSection />

        {/* Live news feed — editorial grid with trending ticker */}
        <BreakingScrolls
          initialArticles={initialData?.articles}
          initialTrending={initialData?.trending}
          initialFreshCount={initialData?.freshCount}
          initialSourceCount={initialData?.sourceCount}
        />

        {/* Interactive world heatmap — live news hotspots */}
        <NewsPulseMap />

        {/* Viral per category — sports, tech, entertainment */}
        <WhatsHot />

        {/* Multi-platform perspective — same story, different platforms */}
        <PerspectiveLens />

        {/* Sneak peeks — What If, Creator Hub, Newsletter */}
        <FeaturePeeks />
      </main>
      <Footer />

      {/* Structured data for SEO */}
      {initialData?.articles && initialData.articles.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "NewsLens",
              description: "Real-time news intelligence across 20+ sources",
              url: "https://newslens.app",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://newslens.app/trending?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      )}
    </>
  );
}
