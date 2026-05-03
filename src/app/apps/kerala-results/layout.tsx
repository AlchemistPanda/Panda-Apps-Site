import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kerala Election Results 2026 — Live Dashboard | Panda Apps",
  description:
    "Live Kerala Assembly Election Results 2026. Real-time counting updates for all 140 constituencies. Alliance-wise tally, winners list, key battles, district-wise filtering. LDF vs UDF vs NDA.",
  keywords: "Kerala election results 2026, Kerala assembly election, live counting, LDF, UDF, NDA, constituency results",
};

export default function KeralaResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
