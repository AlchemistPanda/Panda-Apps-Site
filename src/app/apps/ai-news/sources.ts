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
    rssUrl: "https://letter.innov8academy.in/", // Beehiiv — fetched via page scraper, not RSS
    color: "#f43f5e",
    priority: true,
  },
  {
    id: "world-of-ai",
    name: "World of AI",
    type: "newsletter",
    rssUrl: "https://worldofai.beehiiv.com/", // Beehiiv — scraped via page, not RSS
    color: "#8b5cf6",
    priority: true,
  },
  {
    id: "evolving-ai",
    name: "Evolving AI Insights",
    type: "newsletter",
    rssUrl: "https://evolvingai.io/", // Beehiiv — scraped via page, not RSS
    color: "#06b6d4",
    priority: true,
  },
  {
    id: "in-world-of-ai",
    name: "In the World of AI",
    type: "newsletter",
    rssUrl: "https://intheworldofai.com/archive", // Beehiiv — scraped via archive page, not RSS
    color: "#a855f7",
  },
  {
    id: "deep-view",
    name: "The Deep View",
    type: "newsletter",
    rssUrl: "https://archive.thedeepview.com/", // Beehiiv — scraped via page, not RSS
    color: "#0ea5e9",
  },
  {
    id: "tech-newsletter",
    name: "Technology News",
    type: "newsletter",
    rssUrl: "https://technology-newsletter.beehiiv.com/", // Beehiiv — scraped via page, not RSS
    color: "#14b8a6",
  },
  // ── Beehiiv newsletters (archive-scraped) ─────────────────────────────────
  {
    id: "the-rundown",
    name: "The Rundown AI",
    type: "newsletter",
    rssUrl: "https://www.therundown.ai/archive", // Beehiiv — scraped via archive page
    color: "#f97316",
  },
  {
    id: "the-neuron",
    name: "The Neuron",
    type: "newsletter",
    rssUrl: "https://www.theneurondaily.com/archive", // Beehiiv — scraped via archive page
    color: "#ec4899",
  },
  {
    id: "mindstream",
    name: "Mindstream",
    type: "newsletter",
    rssUrl: "https://www.mindstream.news/archive", // Beehiiv — scraped via archive page
    color: "#6366f1",
  },
  {
    id: "ai-breakfast",
    name: "AI Breakfast",
    type: "newsletter",
    rssUrl: "https://aibreakfast.beehiiv.com/archive", // Beehiiv — scraped via archive page
    color: "#f59e0b",
  },
  {
    id: "superhuman-ai",
    name: "Superhuman AI",
    type: "newsletter",
    rssUrl: "https://www.superhuman.ai/archive", // Beehiiv — scraped via archive page
    color: "#10b981",
  },
  // ── RSS Newsletters ────────────────────────────────────────────────────────
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
  {
    id: "last-week-ai",
    name: "Last Week in AI",
    type: "newsletter",
    rssUrl: "https://lastweekin.ai/feed",
    color: "#8b5cf6",
  },
  {
    id: "algorithmic-bridge",
    name: "The Algorithmic Bridge",
    type: "newsletter",
    rssUrl: "https://www.thealgorithmicbridge.com/feed",
    color: "#64748b",
  },
  // ── AI News Sites ──────────────────────────────────────────────────────────
  {
    id: "the-decoder",
    name: "The Decoder",
    type: "news",
    rssUrl: "https://the-decoder.com/feed/",
    color: "#0f172a",
  },
  {
    id: "marktechpost",
    name: "MarkTechPost",
    type: "news",
    rssUrl: "https://www.marktechpost.com/feed/",
    color: "#1d4ed8",
  },
];

export const SOURCE_MAP = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
