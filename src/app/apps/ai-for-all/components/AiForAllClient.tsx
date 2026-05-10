"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import HeroSection from "./HeroSection";
import SessionsSection from "./SessionsSection";
import VotingSection from "./VotingSection";
import AboutSection from "./AboutSection";
import type { Session } from "@/lib/ai4all";

export default function AiForAllClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/ai-for-all/sessions")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setSessions(data) : setSessions([]))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Fixed gradient background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 50%, rgba(168,85,247,0.10) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 50%)
          `,
        }}
      />
      <div className="grid-pattern" />

      {/* Sticky Nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Panda Apps</span>
          </Link>

          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs">
              🤖
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI for All
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-5 text-sm text-muted">
            <a href="#sessions" className="hover:text-foreground transition-colors">Sessions</a>
            <a href="#vote" className="hover:text-foreground transition-colors">Vote</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </nav>

          {/* Mobile nav pill */}
          <nav className="sm:hidden flex items-center gap-3 text-xs text-muted">
            <a href="#sessions" className="hover:text-foreground transition-colors">Sessions</a>
            <a href="#vote" className="hover:text-foreground transition-colors">Vote</a>
          </nav>
        </div>
      </header>

      {/* Page Sections */}
      <main className="relative z-10">
        <HeroSection sessions={sessions} loading={loading} />
        <SessionsSection sessions={sessions} loading={loading} />
        <VotingSection />
        <AboutSection />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 py-8 px-4 text-center text-sm text-muted">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <span>
            Made with ❤️ by{" "}
            <Link href="/" className="text-violet-400 hover:underline">
              Panda Apps
            </Link>
          </span>
          <span className="hidden sm:inline">·</span>
          <Link href="/apps/ai-for-all/admin" className="flex items-center gap-1 text-muted/50 hover:text-muted transition-colors text-xs">
            <Shield className="h-3 w-3" />
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
