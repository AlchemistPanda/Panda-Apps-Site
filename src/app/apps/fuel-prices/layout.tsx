import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Petrol & Diesel Prices — Panda Apps",
  description:
    "Check today's petrol and diesel prices for any Indian state and city. Supports all 36 states & UTs. Optional IP-based location detection — no data stored.",
};

export default function FuelPricesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
