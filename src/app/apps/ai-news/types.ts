export type SourceType = "news" | "newsletter" | "blog";
export type TrendPeriod = "day" | "week" | "month";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  source: string;
  sourceId: string;
  sourceType: SourceType;
  publishedAt: string; // ISO date string
  score?: number;        // upvotes / HN points
  commentCount?: number; // comment count
}

export interface NewsSource {
  id: string;
  name: string;
  type: SourceType;
  rssUrl: string;
  color: string;
}
