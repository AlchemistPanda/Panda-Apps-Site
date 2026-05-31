'use client';

import React from 'react';
import { Inter, Outfit } from "next/font/google";
import "./ledgerweb.css";
import { SecurityLock } from "./components/SecurityLock";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export default function LedgerwebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`ledgerweb-theme ${inter.variable} ${outfit.variable}`}>
      <SecurityLock>
        {children}
      </SecurityLock>
    </div>
  );
}
