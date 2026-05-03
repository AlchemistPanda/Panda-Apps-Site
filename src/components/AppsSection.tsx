"use client";

import { useState, useEffect, useMemo } from "react";
import {
  QrCode, Image, FileText, Palette, Lock, Calculator, GitCompare, Search, X, Sparkles, Coins, TrendingUp, Fuel, Bot, Braces, FileJson, Gem, FileUser, Users, Newspaper, ImagePlus, Vote
} from "lucide-react";
import AppCard from "@/components/AppCard";

const apps = [
  {
    title: "Kerala Election Results 2026",
    description:
      "Live Kerala Assembly Election Results 2026. Real-time counting updates for all 140 constituencies. Alliance-wise tally, winners list, key battles, district-wise filtering.",
    href: "/apps/kerala-results",
    icon: Vote,
    gradient: "from-amber-500 to-orange-600",
    category: "News",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "AI Poster Maker",
    description:
      "Create stunning posters with AI-generated backgrounds, editable text layers, Malayalam/Manglish support, and a full canvas editor. 100% free, no sign-up.",
    href: "/apps/poster-maker",
    icon: ImagePlus,
    gradient: "from-fuchsia-500 to-pink-600",
    category: "Design",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "QR Code Generator",
    description:
      "Generate stunning QR codes with custom colors, logos, patterns, and export in multiple formats. Perfect for business cards, menus, and marketing.",
    href: "/apps/qr-generator",
    icon: QrCode,
    gradient: "from-green-500 to-emerald-600",
    category: "Utility",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "Resume Builder",
    description:
      "Build a professional resume in minutes. 4 modern templates, real-time preview, PDF & JSON export. 100% free, no sign-up, fully in-browser.",
    href: "/apps/resume-builder",
    icon: FileUser,
    gradient: "from-blue-500 to-indigo-600",
    category: "Productivity",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "Image Compressor",
    description:
      "Compress JPEG, PNG, WebP & AVIF images with smart iterative algorithms. Batch processing, format conversion, zero server uploads.",
    href: "/apps/image-compressor",
    icon: Image,
    gradient: "from-blue-500 to-cyan-500",
    category: "Media",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Markdown Editor",
    description:
      "A beautiful live markdown editor with syntax highlighting, preview mode, and export to HTML/PDF.",
    href: "/apps/markdown-editor",
    icon: FileText,
    gradient: "from-purple-500 to-violet-600",
    category: "Productivity",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Color Palette",
    description:
      "Generate beautiful color palettes from images, explore trending palettes, and export for your design projects.",
    href: "/apps/color-palette",
    icon: Palette,
    gradient: "from-pink-500 to-rose-600",
    category: "Design",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Password Generator",
    description:
      "Create strong, secure passwords with customisable length, character types, and strength analysis. Passwords are generated in your browser and never saved anywhere.",
    href: "/apps/password-generator",
    icon: Lock,
    gradient: "from-amber-500 to-orange-600",
    category: "Security",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Unit Converter",
    description:
      "Convert between 130+ units across 14 categories — length, weight, temperature, speed, data storage, energy, pressure, and more.",
    href: "/apps/unit-converter",
    icon: Calculator,
    gradient: "from-teal-500 to-cyan-600",
    category: "Utility",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Text Diff",
    description:
      "Compare two texts side-by-side with word-level highlighting, order-independent detection, changes-only view, and unified patch export.",
    href: "/apps/text-diff",
    icon: GitCompare,
    gradient: "from-violet-500 to-indigo-600",
    category: "Developer",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Currency Converter",
    description:
      "Convert between 170+ currencies with live exchange rates. Supports all major world currencies — fast, free, and no sign-up required.",
    href: "/apps/currency-converter",
    icon: Coins,
    gradient: "from-emerald-500 to-teal-600",
    category: "Finance",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Fuel Prices India",
    description:
      "Today's petrol and diesel prices for all Indian states and cities. Optional IP-based location detection — no GPS, no personal data stored.",
    href: "/apps/fuel-prices",
    icon: Fuel,
    gradient: "from-orange-500 to-red-600",
    category: "Utility",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "AI Model Benchmarks",
    description:
      "Compare 20+ frontier AI models across 5 benchmarks — GPQA, SWE-bench, ARC-AGI 2, Arena ELO, AA Index. Live daily updates with auto-discovery of new models.",
    href: "/apps/ai-benchmarks",
    icon: Bot,
    gradient: "from-violet-500 to-indigo-600",
    category: "AI",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "Regex Tester",
    description:
      "Test and debug regular expressions in real-time. Live match highlighting, capture groups, replace mode, flag toggles, and a built-in pattern library. Runs entirely in your browser.",
    href: "/apps/regex-tester",
    icon: Braces,
    gradient: "from-violet-500 to-purple-600",
    category: "Developer",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "JSON Tools",
    description:
      "Click through an interactive JSON tree to auto-build JSONPath expressions. Plus: JSONPath tester with filter support, formatter/minifier, and string escaper. Fully in-browser.",
    href: "/apps/json-tools",
    icon: FileJson,
    gradient: "from-amber-500 to-orange-500",
    category: "Developer",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "Gold & Silver Prices",
    description:
      "Current gold and silver prices for India (₹ INR) and international markets (USD). Per gram, 10g, tola, troy oz — plus an 18-month trend chart. Updated daily.",
    href: "/apps/gold-silver",
    icon: Gem,
    gradient: "from-yellow-400 to-amber-500",
    category: "Finance",
    isNew: true,
    isFeatured: false,
  },
  {
    title: "AI News",
    description:
      "Daily AI news and newsletters in one place. Top stories from VentureBeat, TechCrunch, The Verge, Wired, TLDR AI, OpenAI, Google AI, and more — refreshed every 24 hours.",
    href: "/apps/ai-news",
    icon: Newspaper,
    gradient: "from-violet-500 to-fuchsia-600",
    category: "AI",
    isNew: true,
    isFeatured: true,
  },
  {
    title: "Math Tug of War",
    description:
      "An interactive 2-player math game for kids up to 5th standard! Solve addition, subtraction, and multiplication problems faster than your opponent to pull the rope to your side.",
    href: "/apps/math-tug-of-war",
    icon: Users, // Using a different icon here later since I need to import it properly
    gradient: "from-blue-500 to-red-500",
    category: "Games",
    isNew: true,
    isFeatured: true,
  },
];

export default function AppsSection() {
  const [query,  setQuery]  = useState("");
  const [visits, setVisits] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/track")
      .then((r) => r.json())
      .then(setVisits)
      .catch(() => {});
  }, []);

  const sortedApps = useMemo(() => {
    if (Object.keys(visits).length === 0) return apps;
    return [...apps].sort((a, b) => {
      const slugA = a.href.split("/").pop() ?? "";
      const slugB = b.href.split("/").pop() ?? "";
      return (visits[slugB] ?? 0) - (visits[slugA] ?? 0);
    });
  }, [visits]);

  const sortedByPopularity = Object.values(visits).some((v) => v > 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = sortedApps;
    if (!q) return base;
    return base.filter(
      (app) =>
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
    );
  }, [query, sortedApps]);

  return (
    <section id="apps" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-xs font-medium text-accent mb-6">
            <Sparkles className="h-3 w-3" />
            App Collection
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Explore Panda Apps
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            Each app is carefully crafted to be fast, beautiful, and useful.
            More apps are added regularly.
          </p>
          {sortedByPopularity && !query && (
            <p className="text-xs text-muted/60 mt-3 flex items-center justify-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Sorted by most visited
            </p>
          )}
        </div>

        {/* Search bar */}
        <div className="relative max-w-md mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps by name, category or feature…"
            className="w-full rounded-full border border-border/50 bg-card/40 pl-11 pr-10 py-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/40 focus:bg-card/60 transition-all backdrop-blur-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* App grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((app, i) => (
              <div
                key={app.title}
                className={`animate-fade-in-up ${
                  i === 1 ? "animation-delay-200" : ""
                } ${i === 2 ? "animation-delay-400" : ""} ${
                  i === 3 ? "animation-delay-200" : ""
                } ${i === 4 ? "animation-delay-400" : ""} ${
                  i === 5 ? "animation-delay-600" : ""
                }`}
                style={{ opacity: 0, animationFillMode: "forwards" }}
              >
                <AppCard {...app} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🐼</div>
            <p className="text-foreground font-medium mb-1">No apps found</p>
            <p className="text-sm text-muted">
              Try a different keyword — or{" "}
              <button onClick={() => setQuery("")} className="text-accent hover:underline">
                clear the search
              </button>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
