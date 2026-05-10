"use client";

import { Calendar, Clock, Users, ChevronRight, Lock, Loader2 } from "lucide-react";
import type { Session } from "@/lib/ai4all";

interface Props {
  sessions: Session[];
  loading: boolean;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Date TBA";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function SessionsSection({ sessions, loading }: Props) {
  return (
    <section id="sessions" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 mb-6">
            <Calendar className="h-3 w-3" />
            Upcoming Sessions
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Join the Next Session
          </h2>
          <p className="text-muted max-w-xl mx-auto">
            Hands-on AI training open to everyone. Practical, simple, and impactful.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-20 rounded-2xl border border-border/50 bg-card/30 backdrop-blur">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">Sessions Coming Soon</h3>
            <p className="text-muted text-sm max-w-sm mx-auto mb-6">
              No sessions are scheduled yet. Vote on the topics you&apos;d love to learn below
              and we&apos;ll plan sessions based on your interest!
            </p>
            <a
              href="#vote"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 px-5 py-2.5 text-sm font-medium hover:bg-violet-600/30 transition-colors"
            >
              Vote on Topics →
            </a>
          </div>
        )}

        {/* Session cards */}
        <div className="grid gap-6">
          {sessions.map((session, i) => (
            <div
              key={session.id}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden hover:border-violet-500/40 transition-all hover:shadow-lg hover:shadow-violet-500/10 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0, animationFillMode: "forwards" }}
            >
              {/* Gradient top bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${session.coverGradient}`} />

              {/* Cover image */}
              {session.coverImageUrl && (
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={session.coverImageUrl}
                    alt={session.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                </div>
              )}

              <div className="p-6">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          session.isRegistrationOpen
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-muted/20 text-muted border border-border/50"
                        }`}
                      >
                        {session.isRegistrationOpen ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Registration Open</>
                        ) : (
                          <><Lock className="h-3 w-3" />Registration Closed</>
                        )}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{session.title}</h3>
                    {session.description && (
                      <p className="text-muted text-sm leading-relaxed">{session.description}</p>
                    )}
                  </div>

                  {/* Register button */}
                  {session.isRegistrationOpen ? (
                    <a
                      href={`/apps/ai-for-all/register/${session.id}`}
                      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 shadow-md shadow-violet-500/20"
                    >
                      Register Now <ChevronRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border/50 text-muted px-5 py-2.5 text-sm">
                      <Lock className="h-3.5 w-3.5" /> Closed
                    </span>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(session.scheduledDate)}</span>
                  </div>
                  {session.scheduledDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(session.scheduledDate)} · {session.durationMinutes} min
                      </span>
                    </div>
                  )}
                  {session.maxParticipants && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>Max {session.maxParticipants} participants</span>
                    </div>
                  )}
                </div>

                {/* Topics */}
                {session.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {session.topics.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 px-3 py-1 text-xs"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
