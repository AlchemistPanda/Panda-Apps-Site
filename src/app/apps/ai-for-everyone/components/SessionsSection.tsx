"use client";

import { useRef } from "react";
import { Calendar, Clock, Users, ArrowRight, Lock, Loader2, Sparkles, HelpCircle, User } from "lucide-react";
import { Session, getSessionStatus } from "@/lib/ai4all";
import { useLang } from "../i18n";

interface Props {
  sessions: Session[];
  loading: boolean;
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tr, lang } = useLang();

  function formatDate(dateStr: string | null) {
    if (!dateStr) return tr("sessions.dateTba");
    return new Date(dateStr).toLocaleDateString(lang === "ml" ? "ml-IN" : "en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(dateStr: string | null) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString(lang === "ml" ? "ml-IN" : "en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function tilt(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-6px)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0) rotateY(0) translateY(0)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={tilt}
      onMouseLeave={reset}
      className="ai4all-card ai4all-rise p-7 sm:p-8 group cursor-default"
      style={{
        animationDelay: `${index * 0.12}s`,
        background:
          "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(139,92,246,0.15), rgba(20,15,45,0.4) 60%)",
      }}
    >
      {/* Top accent bar */}
      <div className={`absolute -top-px left-6 right-6 h-1 rounded-b-full bg-gradient-to-r ${session.coverGradient} opacity-90`} />

      {/* Cover image */}
      {session.coverImageUrl && (
        <div className="mb-6 -mx-2 -mt-2 rounded-2xl overflow-hidden h-40 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={session.coverImageUrl} alt={session.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a2a]/90 via-transparent to-transparent" />
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        {(() => {
          const statusInfo = getSessionStatus(session);
          if (statusInfo.status === "open") {
            return (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"
                    style={{ background: "rgba(16,185,129,0.15)", color: "var(--a-mint)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <span className="ai4all-pulse" />
                {tr("sessions.regOpen")}
              </span>
            );
          } else if (statusInfo.status === "coming_soon") {
            return (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"
                    style={{ background: "rgba(245,158,11,0.15)", color: "var(--a-amber)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <Clock className="h-3 w-3" />
                Coming Soon
              </span>
            );
          } else if (statusInfo.status === "seats_filled") {
            return (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase"
                    style={{ background: "rgba(239,68,68,0.15)", color: "var(--a-pink)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <Users className="h-3 w-3" />
                Seats Filled
              </span>
            );
          } else {
            return (
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", color: "var(--a-muted)", border: "1px solid var(--a-line-strong)" }}>
                <Lock className="h-3 w-3" />
                {tr("sessions.closed")}
              </span>
            );
          }
        })()}

        {session.maxParticipants && (
          <span className="text-xs font-medium text-[var(--a-muted)] flex items-center gap-1">
            <Users className="h-3 w-3" />
            {session.maxParticipants} {tr("sessions.seats")}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-2xl sm:text-[28px] font-black mb-3 leading-tight tracking-tight" style={{ color: "var(--a-ink)" }}>
        {session.title}
      </h3>

      {/* Description */}
      {session.description && (
        <p className="mb-5 leading-relaxed text-[15px]" style={{ color: "var(--a-ink-soft)" }}>
          {session.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 text-sm font-medium" style={{ color: "var(--a-ink-soft)" }}>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" style={{ color: "var(--a-purple)" }} />
          <span>{formatDate(session.scheduledDate)}</span>
        </div>
        {session.scheduledDate && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" style={{ color: "var(--a-pink)" }} />
            <span>{formatTime(session.scheduledDate)} · {session.durationMinutes} {tr("sessions.min")}</span>
          </div>
        )}
        {session.speaker && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" style={{ color: "var(--a-purple)" }} />
            <span className="font-semibold text-[var(--a-purple-deep)]">Led by {session.speaker}</span>
          </div>
        )}
      </div>

      {/* Topics */}
      {session.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {session.topics.map((t) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.08))",
                color: "var(--a-purple-deep)",
                border: "1px solid rgba(124,58,237,0.15)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      {(() => {
        const statusInfo = getSessionStatus(session);
        if (statusInfo.status === "open") {
          return (
            <a
              href={`/apps/ai-for-everyone/register/${session.id}`}
              className="ai4all-btn ai4all-btn-primary w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4" />
              {tr("sessions.registerNow")}
              <ArrowRight className="h-4 w-4" />
            </a>
          );
        } else if (statusInfo.status === "coming_soon") {
          return (
            <button
              disabled
              className="ai4all-btn ai4all-btn-glass w-full sm:w-auto opacity-70 cursor-not-allowed border border-amber-500/20 text-amber-300"
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Coming Soon
            </button>
          );
        } else if (statusInfo.status === "seats_filled") {
          return (
            <button
              disabled
              className="ai4all-btn ai4all-btn-glass w-full sm:w-auto opacity-60 cursor-not-allowed border border-red-500/20 text-red-300"
            >
              <Users className="h-3.5 w-3.5 text-red-400" />
              Seats Filled
            </button>
          );
        } else {
          return (
            <button
              disabled
              className="ai4all-btn ai4all-btn-glass w-full sm:w-auto opacity-60 cursor-not-allowed"
            >
              <Lock className="h-3.5 w-3.5" />
              {tr("sessions.regClosed")}
            </button>
          );
        }
      })()}
    </div>
  );
}

export default function SessionsSection({ sessions, loading }: Props) {
  const { tr } = useLang();

  return (
    <section id="sessions" className="relative py-24 sm:py-32 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="ai4all-rise ai4all-eyebrow mb-6">
            <Calendar className="h-3 w-3" />
            <span>{tr("sessions.eyebrow")}</span>
          </div>
          <h2
            className="ai4all-rise ai4all-d-1 font-black tracking-tight leading-[0.95] mb-4"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", color: "var(--a-ink)", letterSpacing: "-0.03em" }}
          >
            {tr("sessions.heading")} <span className="ai4all-grad-text">{tr("sessions.headingHighlight")}</span>
            {tr("sessions.headingSuffix") && ` ${tr("sessions.headingSuffix")}`}
          </h2>
          <p
            className="ai4all-rise ai4all-d-2 max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--a-ink-soft)", fontSize: "clamp(1rem, 1.5vw, 1.125rem)" }}
          >
            {tr("sessions.subtitle")}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--a-purple)" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <div className="ai4all-card ai4all-rise text-center py-20 px-6">
            <div className="text-6xl mb-5 inline-block ai4all-float">🚀</div>
            <h3 className="text-2xl font-black mb-3" style={{ color: "var(--a-ink)" }}>
              {tr("sessions.launchingSoon")}
            </h3>
            <p className="max-w-md mx-auto mb-6 leading-relaxed" style={{ color: "var(--a-ink-soft)" }}>
              {tr("sessions.noSessions")}
            </p>
            <a href="#vote" className="ai4all-btn ai4all-btn-primary">
              <Sparkles className="h-4 w-4" />
              {tr("hero.voteTopics")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Sessions grid */}
        {!loading && sessions.length > 0 && (
          <div className={sessions.length === 1 ? "flex justify-center" : "grid sm:grid-cols-2 gap-6 sm:gap-8"}>
            {sessions.map((s, i) => (
              <div key={s.id} className={sessions.length === 1 ? "w-full max-w-2xl" : ""}>
                <SessionCard session={s} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
