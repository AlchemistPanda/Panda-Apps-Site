import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unit Converter — PandaApps",
  description:
    "Convert between hundreds of units across length, weight, temperature, area, volume, speed, time, data, pressure, energy, power, angle, fuel economy, and more. Fast, accurate, and free.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
