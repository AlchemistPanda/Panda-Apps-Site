import Link from "next/link";
import { Github, Twitter, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/50 bg-background/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <span className="text-lg">🐼</span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                Panda<span className="text-accent">Apps</span>
              </span>
            </Link>
            <p className="text-sm text-muted max-w-md leading-relaxed">
              A collection of beautifully crafted, high-performance web apps 
              that are free to use. Built with modern technologies for the best 
              user experience.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#apps" className="text-sm text-muted hover:text-foreground transition-colors">
                  All Apps
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-sm text-muted hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted hover:text-foreground transition-colors">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Connect</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border hover:border-accent/30 hover:bg-accent/10 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4 text-muted" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-border hover:border-accent/30 hover:bg-accent/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 text-muted" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Panda Apps. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            Made by a Panda with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> using Next.js & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
