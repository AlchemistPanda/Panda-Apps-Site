"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Share2, Users, ArrowLeft, Sparkles, Download, Copy } from "lucide-react";
import type { Session } from "@/lib/ai4all";

const CONFETTI_COLORS = ["#7C3AED", "#EC4899", "#F97316", "#FBBF24", "#10B981", "#38BDF8"];

function Confetti() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="ai4all-confetti">
      {Array.from({ length: 80 }).map((_, i) => {
        const left = Math.random() * 100;
        const duration = 3 + Math.random() * 3;
        const delay = Math.random() * 1.5;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const size = 6 + Math.random() * 10;
        const isCircle = Math.random() > 0.5;
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              borderRadius: isCircle ? "50%" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId") ?? "";
  const name = params.get("name") ?? "Friend";
  const regCode = params.get("regCode") ?? "";
  const [session, setSession] = useState<Session | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/ai-for-everyone/sessions/${sessionId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setSession)
      .catch(() => null);
  }, [sessionId]);

  function copyLink() {
    const url = `${window.location.origin}/apps/ai-for-everyone`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyCode() {
    if (!regCode) return;
    navigator.clipboard.writeText(regCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Confetti />
      <div className="ai4all-aurora">
        <span className="ai4all-aurora-c" />
      </div>
      <div className="ai4all-noise" />

      <div className="relative z-10 max-w-xl mx-auto px-5 py-16">
        {/* Animated checkmark */}
        <div className="text-center mb-8 ai4all-rise">
          <div className="relative inline-flex">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 blur-2xl opacity-60 animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-pink-500/40">
              <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={2.5} />
            </div>
            <span className="absolute -top-1 -right-2 text-3xl ai4all-float">✨</span>
            <span
              className="absolute -bottom-1 -left-3 text-2xl"
              style={{ animation: "a-float 6s ease-in-out -2s infinite" }}
            >
              🎉
            </span>
          </div>
        </div>

        <h1
          className="ai4all-rise ai4all-d-1 text-center font-black tracking-tight leading-[0.95] mb-3"
          style={{ fontSize: "clamp(2rem, 6vw, 3.25rem)", color: "var(--a-ink)", letterSpacing: "-0.03em" }}
        >
          You&apos;re in,
          <br />
          <span className="ai4all-grad-text">{name}!</span>
        </h1>

        <p
          className="ai4all-rise ai4all-d-2 text-center mb-10 leading-relaxed"
          style={{ color: "var(--a-ink-soft)", fontSize: "clamp(1rem, 2vw, 1.125rem)" }}
        >
          Welcome to the AI for All family 💜
          <br />
          We&apos;re excited to have you on this journey.
        </p>

        {/* Glowing Entry Ticket */}
        {regCode && (
          <div className="ai4all-card ai4all-rise ai4all-d-3 p-6 mb-6 relative overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(139,92,246,0.15)] rounded-3xl">
            {/* Top Ticket Header */}
            <div className="flex items-center justify-between border-b border-dashed border-border/40 pb-4 mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-violet-400">Official Entry Pass</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-fuchsia-400">PandaApps</span>
            </div>

            {/* Left and Right notches for ticket aesthetic */}
            <div className="absolute top-[68px] -left-3 w-6 h-6 rounded-full bg-[#030014] border-r border-white/10" />
            <div className="absolute top-[68px] -right-3 w-6 h-6 rounded-full bg-[#030014] border-l border-white/10" />

            <div className="text-center py-2">
              <span className="text-xs font-bold text-muted block mb-1 uppercase tracking-wider">Your Registration Number</span>
              
              {/* Massive Glowing Code */}
              <div className="relative inline-block mb-3">
                <span className="text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-pulse">
                  {regCode}
                </span>
              </div>

              {/* Copy button */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-muted hover:text-foreground transition-all"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied Ticket Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Friendly warning */}
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl max-w-sm mx-auto">
                <p className="text-[11px] leading-relaxed text-amber-400/90 font-medium">
                  ⚠️ <strong>Please note down this registration number</strong>. You will need to show this to track your seats and mark attendance during the session!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session details card */}
        {session && (
          <div className="ai4all-card ai4all-rise ai4all-d-3 p-7 mb-6 relative overflow-hidden">
            <div className={`absolute -top-px left-7 right-7 h-1 rounded-b-full bg-gradient-to-r ${session.coverGradient}`} />

            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--a-purple-deep)" }}>
              You&apos;re registered for
            </p>
            <h2 className="text-xl font-black tracking-tight mb-1" style={{ color: "var(--a-ink)" }}>
              {session.title}
            </h2>
            {session.scheduledDate && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-sm text-[var(--a-ink-soft)]">
                <p>
                  {new Date(session.scheduledDate).toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                {session.speaker && (
                  <p className="font-semibold text-[var(--a-purple-deep)]">
                    · Led by {session.speaker}
                  </p>
                )}
              </div>
            )}

            {/* WhatsApp Community */}
            {session.whatsappLink && (
              <div
                className="rounded-2xl p-5 mb-5 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(20,184,166,0.10)), white",
                  border: "1px solid rgba(16,185,129,0.20)",
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30">
                    💬
                  </div>
                  <div>
                    <p className="font-black text-[15px]" style={{ color: "#030014" }}>
                      Join our WhatsApp Community
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "#4B5563" }}>
                      Members <strong>cannot</strong> see each other&apos;s phone numbers — your privacy is protected.
                    </p>
                  </div>
                </div>
                <a
                  href={session.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai4all-btn w-full text-white font-bold"
                  style={{ background: "linear-gradient(135deg, #10B981, #14B8A6)" }}
                >
                  <Users className="h-4 w-4" />
                  Join Community
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Apps to download */}
            {session.appsToDownload && session.appsToDownload.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--a-purple-deep)" }}>
                  <Download className="h-3 w-3" />
                  Download before the session
                </p>
                <div className="space-y-2">
                  {session.appsToDownload.map((app, i) => (
                    <a
                      key={app.name}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai4all-rise group flex items-center justify-between rounded-xl border border-[var(--a-line)] bg-white hover:border-[var(--a-purple)] hover:shadow-md px-4 py-3 transition-all"
                      style={{ animationDelay: `${0.4 + i * 0.05}s` }}
                    >
                      <span className="font-semibold text-sm group-hover:text-[var(--a-purple)] transition-colors" style={{ color: "var(--a-ink)" }}>
                        {app.name}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5" style={{ color: "var(--a-muted)" }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share CTA */}
        <div className="ai4all-card ai4all-rise ai4all-d-4 p-6 mb-6 text-center">
          <div className="text-3xl mb-2 inline-block ai4all-float">🌟</div>
          <p className="font-black text-lg mb-1" style={{ color: "var(--a-ink)" }}>
            Know someone who should join?
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--a-ink-soft)" }}>
            Share AI for All with your friends and colleagues — let&apos;s upskill everyone together!
          </p>
          <button onClick={copyLink} className="ai4all-btn ai4all-btn-glass w-full sm:w-auto">
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Link copied! ✨" : "Copy sharing link"}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/apps/ai-for-everyone"
            className="inline-flex items-center gap-1.5 text-sm font-medium group"
            style={{ color: "var(--a-ink-soft)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to AI for Everyone
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
