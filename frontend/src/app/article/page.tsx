import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

/*
  Article detail page — SEO-friendly wrapper for external news articles.
  URL: /article?url=<encoded>&title=<encoded>&source=<encoded>

  Purpose:
  - Gives each article a unique, indexable URL on NewsLens
  - Provides OG/Twitter meta for social sharing
  - Shows article context before redirecting to the source
*/

interface PageProps {
  searchParams: Promise<{ url?: string; title?: string; source?: string; image?: string; description?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const title = params.title || "Article — NewsLens";
  const description = params.description || "Read this article on NewsLens";
  const image = params.image || undefined;

  return {
    title: `${title} — NewsLens`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function ArticlePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { url, title, source, image, description } = params;

  if (!url) redirect("/");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <article className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-mist-gray/40 mb-6 font-heading">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
            <span>/</span>
            <span className="text-mist-gray/60">Article</span>
          </nav>

          {/* Article image */}
          {image && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden mb-6 border border-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white leading-tight mb-4">
            {title || "Untitled Article"}
          </h1>

          {/* Source */}
          {source && (
            <p className="text-sm text-mist-gray/50 font-heading mb-6">
              Source: <span className="text-mist-gray/70">{source}</span>
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="text-base text-mist-gray/60 leading-relaxed mb-8">
              {description}
            </p>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-chakra-orange/90 text-sm font-heading font-semibold text-white hover:bg-chakra-orange transition-all"
            >
              Read Full Article
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
            <Link
              href="/trending"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/[0.08] text-sm font-heading text-mist-gray/60 hover:text-white hover:border-white/[0.15] transition-all"
            >
              Back to Trending
            </Link>
          </div>

          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                headline: title,
                description,
                ...(image ? { image: [image] } : {}),
                publisher: {
                  "@type": "Organization",
                  name: source || "NewsLens",
                },
                mainEntityOfPage: url,
              }),
            }}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
