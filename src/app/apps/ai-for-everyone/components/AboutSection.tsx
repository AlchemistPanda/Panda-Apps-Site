"use client";

import { Heart, Globe, BookOpen, Zap } from "lucide-react";
import { useLang } from "../i18n";

const NGOs = ["UNICEF India", "GiveIndia", "PM CARES Fund", "CRY"];

export default function AboutSection() {
  const { tr } = useLang();

  const PILLARS = [
    {
      icon: Globe,
      emoji: "🌍",
      title: tr("about.pillar1Title"),
      body: tr("about.pillar1Body"),
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: Heart,
      emoji: "💝",
      title: tr("about.pillar2Title"),
      body: tr("about.pillar2Body"),
      gradient: "from-pink-500 to-rose-600",
    },
    {
      icon: BookOpen,
      emoji: "📚",
      title: tr("about.pillar3Title"),
      body: tr("about.pillar3Body"),
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: Zap,
      emoji: "⚡",
      title: tr("about.pillar4Title"),
      body: tr("about.pillar4Body"),
      gradient: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <section id="about" className="relative py-24 sm:py-32 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="ai4all-rise ai4all-eyebrow mb-6">
            <Heart className="h-3 w-3" />
            <span>{tr("about.eyebrow")}</span>
          </div>
          <h2
            className="ai4all-rise ai4all-d-1 font-black tracking-tight leading-[0.95] mb-6"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", color: "var(--a-ink)", letterSpacing: "-0.03em" }}
          >
            {tr("about.heading")} <span className="ai4all-grad-text">AI for All</span>{tr("about.headingEnd")}
          </h2>
          <p
            className="ai4all-rise ai4all-d-2 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--a-ink-soft)", fontSize: "clamp(1rem, 1.7vw, 1.25rem)" }}
          >
            {tr("about.subtitle").split("{highlight}")[0]}
            <strong style={{ color: "var(--a-ink)" }}>{tr("about.subtitleHighlight")}</strong>
          </p>
        </div>

        {/* Big editorial quote */}
        <div className="ai4all-card ai4all-rise relative p-10 sm:p-14 mb-16 text-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(196,181,253,0.30) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(253,164,175,0.30) 0%, transparent 50%)",
            }}
          />
          <div className="relative z-10">
            <div className="text-7xl leading-none mb-4 inline-block ai4all-grad-text font-black">&ldquo;</div>
            <blockquote
              className="font-bold leading-[1.15] tracking-tight max-w-3xl mx-auto"
              style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", color: "var(--a-ink)" }}
            >
              {tr("about.quote").split("{highlight}")[0]}
              <span className="ai4all-grad-text">{tr("about.quoteHighlight")}</span>
              {tr("about.quote").split("{highlight}")[1]}
            </blockquote>
            <p
              className="mt-8 text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--a-purple-deep)" }}
            >
              {tr("about.quoteAuthor")}
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="ai4all-card ai4all-rise p-8 group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-5">
                <div
                  className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${p.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform`}
                >
                  {p.emoji}
                </div>
                <div>
                  <h3 className="font-black text-xl mb-2 tracking-tight" style={{ color: "var(--a-ink)" }}>
                    {p.title}
                  </h3>
                  <p className="leading-relaxed text-[15px]" style={{ color: "var(--a-ink-soft)" }}>
                    {p.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Donation transparency banner */}
        <div
          className="ai4all-card ai4all-rise relative p-10 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.15)), rgba(255,255,255,0.03)",
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #FBBF24, transparent)" }}
          />
          <div className="relative z-10 text-center">
            <div className="text-5xl mb-4 inline-block ai4all-float">🔍</div>
            <h3
              className="font-black tracking-tight mb-4"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--a-ink)", letterSpacing: "-0.02em" }}
            >
              {tr("about.donationTitle")}
            </h3>
            <p
              className="max-w-2xl mx-auto mb-6 leading-relaxed"
              style={{ color: "var(--a-ink-soft)", fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
            >
              {tr("about.donationBody").split("{directly}")[0]}
              <strong style={{ color: "var(--a-ink)" }}>{tr("about.directly")}</strong>
              {tr("about.donationBody").split("{directly}")[1]}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {NGOs.map((n, i) => (
                <span
                  key={n}
                  className="ai4all-chip ai4all-rise"
                  style={{
                    animationDelay: `${0.2 + i * 0.08}s`,
                    color: "var(--a-orange)",
                    borderColor: "rgba(249,115,22,0.30)",
                    background: "rgba(249,115,22,0.10)",
                  }}
                >
                  ✓ {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
