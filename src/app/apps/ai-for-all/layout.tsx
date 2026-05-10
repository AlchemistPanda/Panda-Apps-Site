import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for All – Learn AI. For Everyone.",
  description:
    "Free & affordable AI training sessions for everyone. Learn image generation, poster creation, video tools and more. Register for upcoming sessions and vote on topics.",
  keywords: ["AI training", "AI for everyone", "learn AI", "image generation", "AI tools", "Kerala"],
  openGraph: {
    title: "AI for All – Learn AI. For Everyone.",
    description:
      "Affordable AI training sessions open to all. Register, learn, grow.",
    type: "website",
  },
};

export default function AiForAllLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
