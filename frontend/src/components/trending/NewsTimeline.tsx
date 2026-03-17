"use client";

import { Timeline } from "@/components/ui/timeline";
import type { Article, SocialPost } from "@/types/news";
import SharinganEye from "./SharinganEye";
import NewsCard from "./NewsCard";
import SocialCard from "./SocialCard";
import { groupByHour, type TimelineItem } from "./constants";

function NewsTimeline({
  articles,
  socialPosts,
  userLang,
  onVoiceRead,
  currentCategory,
  onOpenReader,
}: {
  articles: Article[];
  socialPosts: SocialPost[];
  userLang: string;
  onVoiceRead: (text: string) => void;
  currentCategory: string;
  onOpenReader: (article: Article) => void;
}) {
  // Merge articles + social posts into a single chronological list
  const merged: TimelineItem[] = [
    ...articles.map((a) => ({
      type: "article" as const,
      time: new Date(a.publishedAt),
      data: a,
    })),
    ...socialPosts.slice(0, 4).map((p) => ({
      type: "social" as const,
      time: new Date(p.timestamp),
      data: p,
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  const groups = groupByHour(merged);

  const timelineData = groups.map((group) => ({
    title: group.label,
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
        {group.items.map((item, i) => {
          if (item.type === "article") {
            const article = item.data as Article;
            return (
              <NewsCard
                key={`tl-art-${article.url}-${i}`}
                article={article}
                index={i}
                userLang={userLang}
                onVoiceRead={onVoiceRead}
                currentCategory={currentCategory}
                onOpenReader={onOpenReader}
              />
            );
          } else {
            const post = item.data as SocialPost;
            return (
              <SocialCard
                key={`tl-soc-${post.url}-${i}`}
                post={post}
                index={i}
                currentCategory={currentCategory}
                time={item.time}
              />
            );
          }
        })}
      </div>
    ),
  }));

  if (timelineData.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2 px-2">
        <SharinganEye size={18} spin glow />
        <h2 className="text-lg font-heading font-bold text-scroll-cream">Intelligence Timeline</h2>
        <span className="text-[10px] font-mono text-mist-gray/40">News + Social combined</span>
      </div>
      <Timeline data={timelineData} />
    </div>
  );
}

export default NewsTimeline;
