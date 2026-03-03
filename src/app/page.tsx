import {
  QrCode,
  Image,
  FileText,
  Palette,
  Lock,
  Calculator,
  ArrowRight,
  Zap,
  Globe,
  Shield,
  Sparkles,
} from "lucide-react";
import AppCard from "@/components/AppCard";
import HeroSection from "@/components/HeroSection";

/* ── App catalogue ── */
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
];

/* ── Features ── */
const features = [
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Built with Next.js and optimized for instant load times. No bloated bundles.",
  },
  {
    icon: Globe,
    title: "100% Free",
    description: "All apps are completely free to use. No sign-up, no hidden fees, no limits.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays in your browser. We don't track, store, or sell your information.",
  },
  {
    icon: Sparkles,
    title: "Modern Design",
    description: "Beautiful, intuitive interfaces designed for the best user experience.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <HeroSection />

      {/* ── Apps Section ── */}
      <section id="apps" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-xs font-medium text-accent mb-6">
              <Sparkles className="h-3 w-3" />
              App Collection
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Explore Our Apps
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Each app is carefully crafted to be fast, beautiful, and useful. 
              More apps are added regularly.
            </p>
          </div>

          {/* App grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app, i) => (
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
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Why Panda Apps?
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              We believe great tools should be accessible to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/40 bg-card/30 p-6 text-center hover:border-accent/20 hover:bg-card/50 transition-all"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 mb-4">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl border border-border/40 bg-gradient-to-b from-card/80 to-card/30 p-12 sm:p-16 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Ready to try our apps?
              </h2>
              <p className="text-muted text-lg max-w-xl mx-auto mb-8">
                Start with our QR Code Generator — create beautiful, customizable QR codes in seconds.
              </p>
              <a
                href="/apps/qr-generator"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
              >
                Launch QR Generator
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
