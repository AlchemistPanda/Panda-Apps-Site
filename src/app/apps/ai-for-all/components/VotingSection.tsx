"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, Plus, Send, Loader2, CheckCircle2, ChevronDown, Vote, Heart } from "lucide-react";

interface VoteOptionWithCount {
  id: string;
  label: string;
  description: string;
  emoji: string;
  isApproved: boolean;
  voteCount: number;
  userVoted: boolean;
}

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem("ai4all_voter_id");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("ai4all_voter_id", fp);
  }
  return fp;
}

function HeartBurst({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 60;
        return (
          <Heart
            key={i}
            className="absolute h-5 w-5 fill-pink-500 text-pink-500"
            style={{
              animation: `heartBurst 0.8s cubic-bezier(0.22,1,0.36,1) forwards`,
              ["--tx" as never]: `${Math.cos(angle) * dist}px`,
              ["--ty" as never]: `${Math.sin(angle) * dist}px`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes heartBurst {
          0%   { opacity: 1; transform: translate(0,0) scale(0.6); }
          100% { opacity: 0; transform: translate(var(--tx),var(--ty)) scale(1.3) rotate(60deg); }
        }
      `}</style>
    </div>
  );
}

export default function VotingSection() {
  const [options, setOptions] = useState<VoteOptionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ label: "", description: "", name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState("");
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  useEffect(() => {
    const fp = getFingerprint();
    setFingerprint(fp);
    fetch(`/api/ai-for-all/votes?fingerprint=${fp}`)
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setOptions(data) : setOptions([])))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  const vote = useCallback(
    async (optionId: string, e?: React.MouseEvent) => {
      if (votingId) return;
      const alreadyVoted = options.find((o) => o.id === optionId)?.userVoted;
      if (alreadyVoted) return;

      if (e) {
        setBurst({ x: e.clientX, y: e.clientY, key: Date.now() });
        setTimeout(() => setBurst(null), 800);
      }

      setVotingId(optionId);
      setOptions((prev) =>
        prev.map((o) => (o.id === optionId ? { ...o, userVoted: true, voteCount: o.voteCount + 1 } : o))
      );

      try {
        const res = await fetch("/api/ai-for-all/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId, fingerprint }),
        });
        if (!res.ok) {
          setOptions((prev) =>
            prev.map((o) => (o.id === optionId ? { ...o, userVoted: false, voteCount: o.voteCount - 1 } : o))
          );
        }
      } catch {
        setOptions((prev) =>
          prev.map((o) => (o.id === optionId ? { ...o, userVoted: false, voteCount: o.voteCount - 1 } : o))
        );
      } finally {
        setVotingId(null);
      }
    },
    [fingerprint, options, votingId]
  );

  async function submitSuggestion() {
    if (!form.label.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/ai-for-all/votes/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          description: form.description,
          submittedBy: form.name || "Anonymous",
        }),
      });
      setSubmitted(true);
      setForm({ label: "", description: "", name: "" });
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <section id="vote" className="relative py-24 sm:py-32 px-5">
      {burst && <HeartBurst key={burst.key} x={burst.x} y={burst.y} />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="ai4all-rise ai4all-eyebrow mb-6">
            <Vote className="h-3 w-3" />
            <span>Community Vote</span>
          </div>
          <h2
            className="ai4all-rise ai4all-d-1 font-black tracking-tight leading-[0.95] mb-4"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", color: "var(--a-ink)", letterSpacing: "-0.03em" }}
          >
            Shape what we <span className="ai4all-grad-text">teach next</span>
          </h2>
          <p
            className="ai4all-rise ai4all-d-2 max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--a-ink-soft)", fontSize: "clamp(1rem, 1.5vw, 1.125rem)" }}
          >
            Vote for the topics you&apos;d love to see in upcoming sessions. Your votes directly
            shape what we build.
          </p>

          {totalVotes > 0 && (
            <div
              className="ai4all-rise ai4all-d-3 inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(236,72,153,0.10))",
                color: "var(--a-purple-deep)",
              }}
            >
              <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" />
              <span>{totalVotes.toLocaleString()} community votes cast</span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--a-pink)" }} />
          </div>
        )}

        {/* Vote cards grid */}
        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {sorted.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
              return (
                <div
                  key={opt.id}
                  className={`ai4all-card ai4all-rise p-6 relative overflow-hidden ${
                    opt.userVoted ? "ai4all-rainbow" : ""
                  }`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Decorative corner gradient */}
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-30 blur-2xl"
                    style={{
                      background: opt.userVoted
                        ? "radial-gradient(circle, #EC4899, transparent)"
                        : "radial-gradient(circle, #C4B5FD, transparent)",
                    }}
                  />

                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="text-4xl filter drop-shadow-sm">{opt.emoji}</div>
                    {opt.userVoted && (
                      <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                           style={{ background: "linear-gradient(135deg, #EC4899, #F97316)", color: "white" }}>
                        <CheckCircle2 className="h-3 w-3" />
                        Voted
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-1.5 tracking-tight" style={{ color: "var(--a-ink)" }}>
                    {opt.label}
                  </h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--a-ink-soft)" }}>
                    {opt.description}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-1.5 text-xs font-semibold" style={{ color: "var(--a-muted)" }}>
                      <span>
                        <strong style={{ color: "var(--a-ink)" }}>{opt.voteCount}</strong> vote{opt.voteCount !== 1 ? "s" : ""}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="ai4all-progress-track">
                      <div className="ai4all-progress-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>

                  {/* Vote button */}
                  <button
                    onClick={(e) => vote(opt.id, e)}
                    disabled={!!votingId || opt.userVoted}
                    className={`w-full flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all ${
                      opt.userVoted ? "cursor-default" : "active:scale-95 hover:shadow-md"
                    }`}
                    style={
                      opt.userVoted
                        ? {
                            background: "linear-gradient(135deg, #FCE7F3, #FED7AA)",
                            color: "#9F1239",
                          }
                        : {
                            background: "white",
                            border: "1.5px solid var(--a-line-strong)",
                            color: "var(--a-ink)",
                          }
                    }
                  >
                    {votingId === opt.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className={`h-4 w-4 ${opt.userVoted ? "fill-rose-700" : ""}`} />
                    )}
                    {opt.userVoted ? "Thanks for voting!" : "Vote for this"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Suggest a topic */}
        <div className="ai4all-card overflow-hidden">
          <button
            onClick={() => {
              setShowSuggest((v) => !v);
              setSubmitted(false);
            }}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[var(--a-blush)] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-[15px]" style={{ color: "var(--a-ink)" }}>
                  Got an idea? Suggest a topic
                </p>
                <p className="text-xs" style={{ color: "var(--a-muted)" }}>
                  Submit your own — once approved, it joins the vote
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${showSuggest ? "rotate-180" : ""}`}
              style={{ color: "var(--a-muted)" }}
            />
          </button>

          {showSuggest && (
            <div className="px-6 pb-6 border-t border-[var(--a-line)] pt-5">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex w-16 h-16 rounded-full items-center justify-center mb-4 bg-gradient-to-br from-mint-400 to-emerald-500"
                       style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}>
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-bold text-lg mb-1" style={{ color: "var(--a-ink)" }}>
                    Thank you! 💜
                  </p>
                  <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--a-ink-soft)" }}>
                    Your idea is under review. Once approved, it will appear in the voting list above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                      Topic Name *
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="e.g. AI for Malayalam Typing"
                      value={form.label}
                      onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                      className="ai4all-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                      Description (optional)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={300}
                      placeholder="Briefly describe what you'd like to learn..."
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="ai4all-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: "var(--a-purple-deep)" }}>
                      Your Name (optional)
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="Anonymous"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="ai4all-input"
                    />
                  </div>
                  <button
                    onClick={submitSuggestion}
                    disabled={!form.label.trim() || submitting}
                    className="ai4all-btn ai4all-btn-primary disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Suggestion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
