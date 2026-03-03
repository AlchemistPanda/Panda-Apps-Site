"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import HeroParticles from "./HeroParticles";
import PandaCharacter from "./PandaCharacter";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <HeroParticles />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-10rem)]">

          {/* ── Left: text ── */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Technology that works for people
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-6 animate-fade-in-up animation-delay-200">
              <span className="block">Free Web Apps,</span>
              <span className="shimmer-text block mt-2">Beautifully Crafted.</span>
            </h1>

            {/* Subheading */}
            <p
              className="max-w-xl text-lg sm:text-xl text-muted leading-relaxed mb-10 animate-fade-in-up animation-delay-400"
              style={{ opacity: 0, animationFillMode: "forwards" }}
            >
              Panda philosophy is simple — use technology to genuinely help people.
              Every app here is built with that belief: fast, free, secure, and
              designed to make your day a little easier.
            </p>

            {/* CTA */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up animation-delay-600"
              style={{ opacity: 0, animationFillMode: "forwards" }}
            >
              <a
                href="#apps"
                className="group flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Explore All Apps
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* Stats */}
            <div
              className="mt-14 grid grid-cols-3 gap-8 max-w-xs animate-fade-in-up animation-delay-800"
              style={{ opacity: 0, animationFillMode: "forwards" }}
            >
              {[
                { value: "7", label: "Apps" },
                { value: "100%", label: "Free" },
                { value: "0", label: "Tracking" },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-accent">{stat.value}</div>
                  <div className="text-xs text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: panda ── */}
          <div
            className="flex justify-center lg:justify-end animate-fade-in-up animation-delay-400"
            style={{ opacity: 0, animationFillMode: "forwards" }}
          >
            <PandaCharacter />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <a href="#apps" aria-label="Scroll to apps">
          <ChevronDown className="h-5 w-5 text-muted/50" />
        </a>
      </div>
    </section>
  );
}
