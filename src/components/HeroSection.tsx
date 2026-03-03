"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import HeroParticles from "./HeroParticles";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroParticles />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Technology that works for people
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6 animate-fade-in-up animation-delay-200">
          <span className="block">Free Web Apps,</span>
          <span className="shimmer-text block mt-2">Beautifully Crafted.</span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed mb-10 animate-fade-in-up animation-delay-400" style={{ opacity: 0, animationFillMode: "forwards" }}>
          My philosophy is simple — use technology to genuinely help people.
          Every app here is built with that belief: fast, free, private, and
          designed to make your day a little easier.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <a
            href="#apps"
            className="group flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore All Apps
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#apps"
            className="flex items-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground hover:bg-card hover:border-accent/20 transition-all"
          >
            Browse All Apps
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-in-up animation-delay-800" style={{ opacity: 0, animationFillMode: "forwards" }}>
          {[
            { value: "7", label: "Apps" },
            { value: "100%", label: "Free" },
            { value: "0", label: "Tracking" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#apps" aria-label="Scroll to apps">
            <ChevronDown className="h-5 w-5 text-muted/50" />
          </a>
        </div>
      </div>
    </section>
  );
}
