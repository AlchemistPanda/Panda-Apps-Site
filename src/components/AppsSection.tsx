"use client";

import { useState, useMemo } from "react";
import {
  QrCode, Image, FileText, Palette, Lock, Calculator, GitCompare, Search, X, Sparkles,
} from "lucide-react";
import AppCard from "@/components/AppCard";

const apps = [
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
];

export default function AppsSection() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (app) =>
        app.title.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
    );
  }, [query]);

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
