import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI News — Panda Apps",
  description:
    "Daily AI news and newsletters in one place. VentureBeat, TechCrunch, The Verge, TLDR AI, OpenAI, Google AI, and more — curated and updated every 24 hours.",
};

export default function AINewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
