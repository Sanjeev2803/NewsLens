export interface Article {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

export interface TrendingTopic {
  title: string;
  traffic: string;
  relatedQueries: string[];
  url: string;
}

export interface SocialPost {
  title: string;
  text: string;
  url: string;
  image: string | null;
  author: string;
  platform: "reddit" | "bluesky" | "youtube" | "wikipedia";
  score: number;
  timestamp: string;
  comments?: number;
}

export interface ApiResponse {
  articles: Article[];
  totalArticles: number;
  freshCount: number;
  sources?: string[];
  trending?: TrendingTopic[];
  region?: string | null;
  error?: string;
}

export interface SocialResponse {
  posts: SocialPost[];
  platforms: string[];
}
