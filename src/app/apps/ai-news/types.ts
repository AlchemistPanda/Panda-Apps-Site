export type SourceType = "news" | "newsletter" | "blog";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  source: string;
  sourceId: string;
  sourceType: SourceType;
  publishedAt: string; // ISO date string
}

export interface NewsSource {
  id: string;
  name: string;
  type: SourceType;
  rssUrl: string;
  color: string;
}
