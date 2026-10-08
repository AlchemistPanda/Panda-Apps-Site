import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Model Benchmarks — Panda Apps",
  description:
    "Compare 70+ frontier AI models across key benchmarks with interactive charts — GPQA Diamond, SWE-bench, ARC-AGI 2, Arena ELO, AA Intelligence Index, and TerminalBench. Auto-updated daily.",
};

export default function AIBenchmarksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
