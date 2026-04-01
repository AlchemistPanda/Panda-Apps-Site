import type { NewsSource } from "./types";

export const SOURCES: NewsSource[] = [
  // ── Daily AI News ──────────────────────────────────────────────────────────
  {
    id: "venturebeat",
    name: "VentureBeat",
    type: "news",
    rssUrl: "https://venturebeat.com/category/ai/feed/",
    color: "#1a73e8",
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    type: "news",
    rssUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
    color: "#0a7dc5",
  },
  {
    id: "theverge",
    name: "The Verge",
    type: "news",
    rssUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    color: "#ff3f00",
  },
  {
    id: "wired",
    name: "Wired",
    type: "news",
    rssUrl: "https://www.wired.com/feed/tag/ai/latest/rss",
    color: "#222222",
  },
  {
    id: "mit-tech-review",
    name: "MIT Tech Review",
    type: "news",
    rssUrl: "https://www.technologyreview.com/feed/",
    color: "#a50034",
  },
  // ── Company Blogs ──────────────────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    type: "blog",
    rssUrl: "https://openai.com/news/rss.xml",
    color: "#10a37f",
  },
  {
    id: "google-ai",
    name: "Google AI",
    type: "blog",
    rssUrl: "https://blog.google/technology/ai/rss/",
    color: "#4285f4",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    type: "blog",
    rssUrl: "https://www.anthropic.com/news/rss",
    color: "#d97706",
  },
  // ── Priority Newsletters ────────────────────────────────────────────────────
  // These are shown first and marked with a priority badge.
  {
    id: "innov8-l8r",
    name: "L8R by innov8",
    type: "newsletter",
    rssUrl: "https://innov8ai.substack.com/feed",
    color: "#f43f5e",
    priority: true,
  },
  {
    id: "world-of-ai",
    name: "World of AI",
    type: "newsletter",
    rssUrl: "https://worldofai.beehiiv.com/feed",
    color: "#8b5cf6",
    priority: true,
  },
  {
    id: "evolving-ai",
    name: "Evolving AI Insights",
    type: "newsletter",
    rssUrl: "https://evolvingai.io/feed",
    color: "#06b6d4",
    priority: true,
  },
  // ── Newsletters ────────────────────────────────────────────────────────────
  {
    id: "tldr-ai",
    name: "TLDR AI",
    type: "newsletter",
    rssUrl: "https://tldr.tech/api/rss/ai",
    color: "#7c3aed",
  },
  {
    id: "import-ai",
    name: "Import AI",
    type: "newsletter",
    rssUrl: "https://importai.substack.com/feed",
    color: "#0ea5e9",
  },
  {
    id: "bens-bites",
    name: "Ben's Bites",
    type: "newsletter",
    rssUrl: "https://bensbites.beehiiv.com/feed",
    color: "#f59e0b",
  },
];

export const SOURCE_MAP = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
