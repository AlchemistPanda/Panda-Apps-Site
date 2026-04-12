import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Poster Maker — Panda Apps",
  description:
    "Create stunning posters with AI-generated backgrounds, custom text layers, Malayalam/Manglish support, and a full canvas editor. 100% free, no sign-up required.",
  keywords: [
    "ai poster maker",
    "poster generator",
    "malayalam poster",
    "manglish",
    "free poster design",
    "ai image generation",
  ],
};

export default function PosterMakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
