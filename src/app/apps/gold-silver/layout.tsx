import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gold & Silver Prices — Panda Apps",
  description:
    "Today's gold and silver prices for India (₹ INR) and international markets (USD). Prices per gram, 10g, tola, troy oz, and kg — plus an 18-month trend chart.",
};

export default function GoldSilverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
