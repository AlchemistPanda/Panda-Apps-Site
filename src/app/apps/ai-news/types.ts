export type SourceType = "news" | "newsletter" | "blog";
export type TrendPeriod = "day" | "week" | "month";
export type RedditSort = "hot" | "new" | "top";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  source: string;
  sourceId: string;
  sourceType: SourceType;
  publishedAt: string; // ISO date string
  imageUrl?: string;       // article thumbnail / hero image
  score?: number;          // upvotes / HN points
  commentCount?: number;   // comment count
}

export interface NewsSource {
  id: string;
  name: string;
  type: SourceType;
  rssUrl: string;
  color: string;
  priority?: boolean; // priority sources are shown first
}
