import { ArrowRight, Zap, Globe, Shield, Sparkles } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import AppsSection from "@/components/AppsSection";

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
    description: "Your data stays in your browser. Panda doesn't track, store, or sell your information.",
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
      <AppsSection />

      {/* ── Features Section ── */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Why Panda Apps?
            </h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">
              Panda believes great tools should be accessible to everyone.
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
                Tools built to help, not to sell.
              </h2>
              <p className="text-muted text-lg max-w-xl mx-auto mb-8">
                7 free apps. No accounts. No tracking. Just useful tools that
                respect your time and your privacy.
              </p>
              <a
                href="#apps"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
              >
                Explore All Apps
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
