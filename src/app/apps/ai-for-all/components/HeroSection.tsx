"use client";

import { Calendar, ChevronDown, Sparkles, Vote } from "lucide-react";
import type { Session } from "@/lib/ai4all";

interface Props {
  sessions: Session[];
  loading: boolean;
}

const FLOATING = ["🤖", "🧠", "🎨", "📝", "🎥", "🔊", "✨", "🚀", "💡", "🌟"];

export default function HeroSection({ sessions, loading }: Props) {
  const openSession = sessions.find((s) => s.isRegistrationOpen);
  const nextSession = sessions[0];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-24 overflow-hidden">
      {/* Floating emoji particles */}
      {FLOATING.map((e, i) => (
        <span
          key={i}
          className="absolute text-2xl select-none pointer-events-none opacity-20"
          style={{
            top: `${10 + ((i * 37) % 75)}%`,
            left: `${5 + ((i * 53) % 90)}%`,
            animation: `float ${5 + (i % 4)}s ease-in-out ${i * 0.7}s infinite`,
            fontSize: `${1.2 + (i % 3) * 0.4}rem`,
          }}
        >
          {e}
        </span>
      ))}

      {/* Glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto animate-fade-in-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 mb-8">
          <Sparkles className="h-3 w-3" />
          Free & Affordable AI Training for Educators
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4 leading-none">
          <span
            className="bg-gradient-to-br from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent"
            style={{ WebkitTextFillColor: "transparent" }}
          >
            AI for All
          </span>
        </h1>

        <p className="text-sm text-violet-400/70 font-medium mb-2 tracking-wider uppercase">
          എല്ലാ ടീച്ചറും AI-ൽ · Every Teacher in AI
        </p>

        <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Hands-on online sessions to upskill teachers with AI tools —
          image creation, poster design, video generation, and more.
          A small fee that goes entirely to those in need.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {!loading && openSession ? (
            <a
              href={`/apps/ai-for-all/register/${openSession.id}`}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-8 py-3.5 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
            >
              <Calendar className="h-4 w-4" />
              Register for Next Session
            </a>
          ) : (
            <a
              href="#sessions"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-8 py-3.5 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
            >
              <Calendar className="h-4 w-4" />
              View Sessions
            </a>
          )}
          <a
            href="#vote"
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-semibold px-8 py-3.5 transition-all hover:-translate-y-0.5"
          >
            <Vote className="h-4 w-4" />
            Vote on Topics
          </a>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
          {[
            { icon: "🎓", label: "For Teachers & Educators" },
            { icon: "💝", label: "Fee donated to NGOs" },
            { icon: "📱", label: "Online & Flexible" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span>{stat.icon}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming session teaser */}
      {!loading && nextSession && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-300">
              Next: <strong>{nextSession.title}</strong>
              {nextSession.scheduledDate && (
                <>
                  {" · "}
                  {new Date(nextSession.scheduledDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
            </div>
            <ChevronDown className="h-5 w-5 text-muted/50 animate-bounce" />
          </div>
        </div>
      )}

      {!loading && !nextSession && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="h-5 w-5 text-muted/50 animate-bounce" />
        </div>
      )}
    </section>
  );
}
