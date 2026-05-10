"use client";

import { Heart, Globe, BookOpen, Zap } from "lucide-react";

const PILLARS = [
  {
    icon: Globe,
    emoji: "🌍",
    title: "No One Left Behind",
    body: "AI is reshaping every profession. Our mission is to ensure everyone—regardless of location, background, or profession—has access to AI skills.",
  },
  {
    icon: Heart,
    emoji: "💝",
    title: "Fee Goes to the Needy",
    body: "A small course fee is collected, but not a single rupee is kept by the instructor. Every payment is donated directly to NGOs supporting those in need.",
  },
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Practical & Simple",
    body: "Sessions are designed for anyone with zero technical background. If you can use WhatsApp, you can use AI tools.",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Hands-On Learning",
    body: "No boring theory. Every session is practical—you create real outputs: images, posters, worksheets, or videos by the end.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 mb-6">
            <Heart className="h-3 w-3" />
            Our Mission
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Why AI for All?
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg leading-relaxed">
            The goal is simple: <strong className="text-foreground">no one should be left behind</strong> in the
            AI revolution. Knowledge should not be a privilege — it should be accessible to everyone.
          </p>
        </div>

        {/* Vision quote */}
        <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-8 mb-12 text-center animate-fade-in-up">
          <div className="text-4xl mb-4">🎯</div>
          <blockquote className="text-xl sm:text-2xl font-semibold text-foreground/90 italic leading-relaxed mb-4">
            &ldquo;AI competency is not a luxury. It&apos;s the next basic skill — and everyone
            deserves it.&rdquo;
          </blockquote>
          <p className="text-muted text-sm">— The AI for All Initiative</p>
        </div>

        {/* Pillars */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 hover:border-violet-500/30 transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: "forwards" }}
            >
              <div className="text-3xl mb-3">{p.emoji}</div>
              <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Donation transparency */}
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-8 text-center animate-fade-in-up">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-3">100% Transparent Donations</h3>
          <p className="text-muted max-w-xl mx-auto leading-relaxed mb-4">
            When you pay the course fee, you directly donate to a verified NGO like UNICEF India or
            GiveIndia. You receive the donation receipt. The instructor keeps nothing.
            We believe in radical transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {["UNICEF India", "GiveIndia", "PM CARES Fund"].map((ngo) => (
              <span
                key={ngo}
                className="rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 px-3 py-1"
              >
                {ngo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
