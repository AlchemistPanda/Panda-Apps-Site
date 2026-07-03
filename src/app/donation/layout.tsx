import React from "react";
import { Nunito } from "next/font/google";
import Link from "next/link";
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
    <div className={`donation-theme ${nunito.variable} relative min-h-screen z-10 w-full flex flex-col`}>
      {/* Background warm grid overlay */}
      <div className="don-grid" />
      
      {/* Simple standalone header for Donation Drive */}
      <header className="bg-white border-b border-[#f0e6df] sticky top-0 z-50 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.01)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Subtitle */}
            <Link href="/donation" className="flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbebe4] border border-[#e8734a]/20 group-hover:bg-[#fbebe4]/80 transition-colors">
                <span className="text-lg">🐼</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-[#2d3436] leading-none">
                  Panda<span className="text-[#e8734a]">Apps</span>
                </span>
                <span className="text-[9px] font-bold text-[#7f8c8d] tracking-wide uppercase mt-0.5">
                  Stationery Donation
                </span>
              </div>
            </Link>

            {/* Link back to Main Hub */}
            <Link 
              href="/"
              className="text-xs font-semibold text-[#7f8c8d] hover:text-[#e8734a] transition-colors bg-[#faf6f0] border border-[#f0e6df] px-3.5 py-1.5 rounded-full"
            >
              Main Site
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="relative z-10 w-full flex-1">
        {children}
      </main>

      {/* Simple standalone footer for Donation Drive */}
      <footer className="border-t border-[#f0e6df] bg-[#faf6f0]/50 py-8 px-4 text-center mt-auto relative z-0">
        <p className="text-xs text-[#7f8c8d]">
          © {new Date().getFullYear()} Panda Apps. All rights reserved.
        </p>
        <p className="text-[10px] text-[#7f8c8d]/60 mt-1">
          School Stationery Donation Drive App
        </p>
      </footer>
    </div>
  );
}
