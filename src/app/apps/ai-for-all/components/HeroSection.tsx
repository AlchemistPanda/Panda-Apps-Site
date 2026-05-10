"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Vote, Sparkles, ArrowRight, Zap } from "lucide-react";
import type { Session } from "@/lib/ai4all";

interface Props {
  sessions: Session[];
  loading: boolean;
}

const TOPICS = ["Image Generation", "Poster Design", "Video Tools", "AI Basics", "Audio Generation", "Worksheets"];
const FLOATERS = [
  { emoji: "🎨", x: "8%", y: "20%", delay: 0, size: 2.4 },
  { emoji: "🤖", x: "85%", y: "15%", delay: 1.5, size: 2.8 },
  { emoji: "✨", x: "12%", y: "70%", delay: 0.8, size: 2 },
  { emoji: "🎬", x: "88%", y: "65%", delay: 2.2, size: 2.4 },
  { emoji: "🎵", x: "5%", y: "45%", delay: 1.2, size: 1.8 },
  { emoji: "💡", x: "92%", y: "40%", delay: 0.4, size: 2.2 },
  { emoji: "📝", x: "20%", y: "85%", delay: 1.8, size: 1.8 },
  { emoji: "🚀", x: "75%", y: "85%", delay: 0.6, size: 2 },
];

export default function HeroSection({ sessions, loading }: Props) {
  const openSession = sessions.find((s) => s.isRegistrationOpen);
  const nextSession = sessions[0];
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = heroRef.current?.getBoundingClientRect();
      if (!r) return;
      setMouse({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    };
    const el = heroRef.current;
    el?.addEventListener("mousemove", onMove);
    return () => el?.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-20 overflow-hidden"
    >
      {/* Spotlight that follows the mouse */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, rgba(236,72,153,0.10), transparent 50%)`,
        }}
      />

      {/* Floating decorative emojis */}
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute select-none pointer-events-none"
          style={{
            left: f.x,
            top: f.y,
            fontSize: `${f.size}rem`,
            animation: `a-float ${7 + i * 0.4}s ease-in-out ${f.delay}s infinite`,
            opacity: 0.7,
            filter: "drop-shadow(0 8px 24px rgba(124,58,237,0.18))",
          }}
        >
          {f.emoji}
        </span>
      ))}

      {/* Decorative gradient orbs */}
      <div
        aria-hidden
        className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C4B5FD 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #FDA4AF 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Eyebrow badge */}
        <div className="ai4all-rise ai4all-eyebrow mb-8">
          <Sparkles className="h-3 w-3" />
          <span>Affordable AI Training · Open to Everyone</span>
        </div>

        {/* Main heading with massive type */}
        <h1
          className="ai4all-rise ai4all-d-1 font-black tracking-tight leading-[0.92] mb-6"
          style={{ fontSize: "clamp(3rem, 11vw, 8rem)", letterSpacing: "-0.04em" }}
        >
          <span className="block text-[var(--a-ink)]">Learn AI.</span>
          <span className="block ai4all-grad-text">For Everyone.</span>
        </h1>

        {/* Malayalam tagline */}
        <p
          className="ai4all-rise ai4all-d-2 mb-3 font-medium tracking-wide"
          style={{ color: "var(--a-purple-deep)", fontSize: "clamp(0.85rem, 2vw, 1rem)" }}
        >
          എല്ലാവർക്കും AI · No One Left Behind
        </p>

        {/* Subtitle */}
        <p
          className="ai4all-rise ai4all-d-2 max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--a-ink-soft)", fontSize: "clamp(1rem, 2vw, 1.25rem)" }}
        >
          Hands-on online sessions to upskill <em className="not-italic font-semibold text-[var(--a-ink)]">anyone</em> with AI tools — image creation,
          poster design, video generation, and more. A small fee that goes <em className="not-italic font-semibold text-[var(--a-ink)]">entirely</em> to those in need.
        </p>

        {/* CTAs */}
        <div className="ai4all-rise ai4all-d-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          {!loading && openSession ? (
            <a href={`/apps/ai-for-all/register/${openSession.id}`} className="ai4all-btn ai4all-btn-primary group">
              <Zap className="h-4 w-4 fill-white" />
              <span>Register for Next Session</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          ) : (
            <a href="#sessions" className="ai4all-btn ai4all-btn-primary group">
              <Calendar className="h-4 w-4" />
              <span>View Sessions</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          )}
          <a href="#vote" className="ai4all-btn ai4all-btn-glass">
            <Vote className="h-4 w-4" />
            <span>Vote on Topics</span>
          </a>
        </div>

        {/* Trust indicators */}
        <div className="ai4all-rise ai4all-d-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          {[
            { icon: "🌍", label: "Open to Everyone" },
            { icon: "💝", label: "Fee donated to NGOs" },
            { icon: "📱", label: "Online & Flexible" },
            { icon: "🔒", label: "Privacy First" },
          ].map((t) => (
            <div
              key={t.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-[var(--a-line)]"
              style={{ color: "var(--a-ink-soft)" }}
            >
              <span>{t.icon}</span>
              <span className="font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee of topics at bottom */}
      <div className="absolute bottom-24 left-0 right-0 ai4all-rise ai4all-d-5">
        <div className="ai4all-marquee">
          <div className="ai4all-marquee-track">
            {[...TOPICS, ...TOPICS, ...TOPICS].map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-semibold text-[var(--a-muted)]">
                <span className="text-2xl">·</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next session teaser bottom */}
      {!loading && nextSession && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 ai4all-rise ai4all-d-6">
          <a
            href="#sessions"
            className="group flex items-center gap-2 text-xs font-medium text-[var(--a-ink-soft)] hover:text-[var(--a-purple)] transition-colors"
          >
            <span className="ai4all-pulse" />
            <span>
              Next: <strong className="text-[var(--a-ink)]">{nextSession.title}</strong>
              {nextSession.scheduledDate &&
                ` · ${new Date(nextSession.scheduledDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}`}
            </span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      )}
    </section>
  );
}
