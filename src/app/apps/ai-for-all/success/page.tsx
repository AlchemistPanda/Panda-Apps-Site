"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Share2, Users } from "lucide-react";
import type { Session } from "@/lib/ai4all";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId") ?? "";
  const name = params.get("name") ?? "Friend";
  const [session, setSession] = useState<Session | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/ai-for-all/sessions/${sessionId}`)
      .then((r) => r.json())
      .then(setSession)
      .catch(() => null);
  }, [sessionId]);

  function copyLink() {
    const url = `${window.location.origin}/apps/ai-for-all`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.15) 0%, transparent 60%)",
        }}
      />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-16 text-center">
        {/* Success animation */}
        <div className="relative inline-flex mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <span className="absolute -top-2 -right-2 text-2xl animate-float">✨</span>
        </div>

        <h1 className="text-3xl font-black mb-3">
          You&apos;re registered, <br />
          <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent" style={{ WebkitTextFillColor: "transparent" }}>
            {name}!
          </span>
        </h1>
        <p className="text-muted mb-10 leading-relaxed">
          Welcome to the AI for All family 🎉 We&apos;re excited to have you join us.
        </p>

        {/* Session details */}
        {session && (
          <div className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-6 mb-6 text-left">
            <div className={`h-0.5 w-full bg-gradient-to-r ${session.coverGradient} rounded-full mb-4`} />
            <h2 className="font-bold mb-1">{session.title}</h2>
            {session.scheduledDate && (
              <p className="text-sm text-muted mb-4">
                {new Date(session.scheduledDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}

            {/* WhatsApp Community */}
            {session.whatsappLink && (
              <div className="mb-4">
                <p className="text-xs font-medium text-violet-300 mb-2 uppercase tracking-wide">
                  Join our WhatsApp Community
                </p>
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">💬</span>
                    <div className="text-left">
                      <p className="font-semibold text-sm">WhatsApp Community</p>
                      <p className="text-xs text-muted">
                        Your privacy is protected — members cannot see each other&apos;s phone numbers.
                        We use a Community with an Announcement channel.
                      </p>
                    </div>
                  </div>
                  <a
                    href={session.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 text-sm transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Join Community
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Apps to download */}
            {session.appsToDownload.length > 0 && (
              <div>
                <p className="text-xs font-medium text-violet-300 mb-2 uppercase tracking-wide">
                  Download before the session
                </p>
                <div className="space-y-2">
                  {session.appsToDownload.map((app) => (
                    <a
                      key={app.name}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 hover:border-violet-500/30 px-4 py-2.5 text-sm transition-all group"
                    >
                      <span className="font-medium group-hover:text-violet-300 transition-colors">
                        {app.name}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share CTA */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-5 mb-6">
          <p className="font-semibold mb-1">Know someone who should join?</p>
          <p className="text-sm text-muted mb-4">
            Share this program with your colleagues and friends — let&apos;s upskill everyone together!
          </p>
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 w-full rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 font-medium py-2.5 text-sm hover:bg-violet-600/30 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            {copied ? "Link Copied! ✓" : "Copy Sharing Link"}
          </button>
        </div>

        <Link
          href="/apps/ai-for-all"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Back to AI for All
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
