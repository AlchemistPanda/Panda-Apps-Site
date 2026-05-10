"use client";

import { Heart, Globe, BookOpen, Zap } from "lucide-react";

const PILLARS = [
  {
    icon: Globe,
    emoji: "🌍",
    title: "No One Left Behind",
    body: "AI is reshaping every profession. Our mission: ensure everyone—regardless of location, background, or profession—has access to AI skills.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Heart,
    emoji: "💝",
    title: "Fee Goes to the Needy",
    body: "A small course fee is collected, but not a single rupee is kept by the instructor. Every payment is donated directly to verified NGOs.",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Practical & Simple",
    body: "Sessions are designed for anyone with zero technical background. If you can use WhatsApp, you can use AI tools.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Hands-On Learning",
    body: "No boring theory. Every session is practical—you create real outputs: images, posters, worksheets, or videos by the end.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const NGOs = ["UNICEF India", "GiveIndia", "PM CARES Fund", "CRY"];

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 sm:py-32 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="ai4all-rise ai4all-eyebrow mb-6">
            <Heart className="h-3 w-3" />
            <span>Our Mission</span>
          </div>
          <h2
            className="ai4all-rise ai4all-d-1 font-black tracking-tight leading-[0.95] mb-6"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", color: "var(--a-ink)", letterSpacing: "-0.03em" }}
          >
            Why <span className="ai4all-grad-text">AI for All</span>?
          </h2>
          <p
            className="ai4all-rise ai4all-d-2 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--a-ink-soft)", fontSize: "clamp(1rem, 1.7vw, 1.25rem)" }}
          >
            Knowledge should not be a privilege —{" "}
            <strong style={{ color: "var(--a-ink)" }}>it should be accessible to everyone.</strong>
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
              AI competency is not a luxury.{" "}
              <span className="ai4all-grad-text">It&apos;s the next basic skill</span> — and
              everyone deserves it.
            </blockquote>
            <p
              className="mt-8 text-sm font-bold uppercase tracking-widest"
              style={{ color: "var(--a-purple-deep)" }}
            >
              — The AI for All Initiative
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
              100% Transparent Donations
            </h3>
            <p
              className="max-w-2xl mx-auto mb-6 leading-relaxed"
              style={{ color: "var(--a-ink-soft)", fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
            >
              When you pay the course fee, you donate{" "}
              <strong style={{ color: "var(--a-ink)" }}>directly</strong> to a verified NGO.
              You receive the donation receipt. The instructor keeps nothing. Radical transparency.
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
