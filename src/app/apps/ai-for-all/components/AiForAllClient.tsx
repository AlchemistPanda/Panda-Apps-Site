"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
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
      .then((data) => (Array.isArray(data) ? setSessions(data) : setSessions([])))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="relative">
      {/* Aurora background */}
      <div className="ai4all-aurora">
        <span className="ai4all-aurora-c" />
      </div>
      <div className="ai4all-noise" />

      {/* Sticky Nav */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/70 backdrop-blur-xl border-b border-[var(--a-line)] shadow-[0_2px_24px_-12px_rgba(124,58,237,0.15)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-1.5 text-sm font-medium text-[var(--a-ink-soft)] hover:text-[var(--a-purple)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Panda Apps</span>
          </Link>

          <Link href="/apps/ai-for-all" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:rotate-6 transition-transform">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 blur-md opacity-50 -z-10 group-hover:opacity-80 transition-opacity" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[15px] font-bold leading-tight ai4all-grad-text">AI for All</p>
              <p className="text-[10px] tracking-wider uppercase text-[var(--a-muted)] leading-tight">
                Learn · Grow · Lead
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {[
              { href: "#sessions", label: "Sessions" },
              { href: "#vote", label: "Vote" },
              { href: "#about", label: "About" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative px-4 py-2 text-[var(--a-ink-soft)] hover:text-[var(--a-purple)] transition-colors group"
              >
                <span>{l.label}</span>
                <span className="absolute left-4 right-4 bottom-1 h-px bg-gradient-to-r from-violet-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </nav>

          {/* Mobile right side */}
          <nav className="md:hidden flex items-center gap-3 text-xs font-medium text-[var(--a-ink-soft)]">
            <a href="#sessions" className="hover:text-[var(--a-purple)]">Sessions</a>
            <a href="#vote" className="hover:text-[var(--a-purple)]">Vote</a>
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
      <footer className="relative z-10 mt-12 border-t border-[var(--a-line)] bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center text-white text-xs">
              ✨
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--a-ink)]">AI for All</p>
              <p className="text-xs text-[var(--a-muted)]">An initiative of Panda Apps</p>
            </div>
          </div>

          <p className="text-xs text-[var(--a-muted)] text-center max-w-md">
            Made with 💜 for everyone who believes knowledge should be free, fair, and accessible.
          </p>

          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-[var(--a-ink-soft)] hover:text-[var(--a-purple)] transition-colors">
              Panda Apps
            </Link>
            <Link
              href="/apps/ai-for-all/admin"
              className="flex items-center gap-1 text-[var(--a-muted)] hover:text-[var(--a-ink-soft)] transition-colors"
            >
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
