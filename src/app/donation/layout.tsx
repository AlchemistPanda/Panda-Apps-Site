import React from "react";
import { Nunito } from "next/font/google";
import "./donation.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "School Stationery Donation Drive 📚 | Panda Apps",
  description: "Track and support our school stationery donation drive. Choose items to pledge and help support local students.",
};

export default function DonationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`donation-theme ${nunito.variable} relative min-h-screen z-10 w-full`}>
      {/* Background warm grid overlay */}
      <div className="don-grid" />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
