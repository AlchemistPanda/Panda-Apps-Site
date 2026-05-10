import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for All – Upskill Every Teacher with AI",
  description:
    "Free & affordable AI training sessions for teachers. Learn image generation, poster creation, video tools and more. Register for upcoming sessions and vote on topics.",
  keywords: ["AI training", "teachers", "education", "image generation", "AI tools", "Kerala"],
  openGraph: {
    title: "AI for All – Upskill Every Teacher with AI",
    description:
      "Affordable AI training sessions for educators. Register, learn, grow.",
    type: "website",
  },
};

export default function AiForAllLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
