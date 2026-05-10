"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, Plus, Send, Loader2, CheckCircle2, ChevronDown, Vote } from "lucide-react";

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

export default function VotingSection() {
  const [options, setOptions] = useState<VoteOptionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ label: "", description: "", name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [fingerprint, setFingerprint] = useState("");

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);

  useEffect(() => {
    const fp = getFingerprint();
    setFingerprint(fp);
    fetch(`/api/ai-for-all/votes?fingerprint=${fp}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setOptions(data) : setOptions([]))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  const vote = useCallback(
    async (optionId: string) => {
      if (votingId) return;
      const alreadyVoted = options.find((o) => o.id === optionId)?.userVoted;
      if (alreadyVoted) return;

      setVotingId(optionId);
      // Optimistic update
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, userVoted: true, voteCount: o.voteCount + 1 } : o
        )
      );

      try {
        const res = await fetch("/api/ai-for-all/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId, fingerprint }),
        });
        if (!res.ok) {
          // Revert on failure
          setOptions((prev) =>
            prev.map((o) =>
              o.id === optionId ? { ...o, userVoted: false, voteCount: o.voteCount - 1 } : o
            )
          );
        }
      } catch {
        setOptions((prev) =>
          prev.map((o) =>
            o.id === optionId ? { ...o, userVoted: false, voteCount: o.voteCount - 1 } : o
          )
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
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <section id="vote" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-medium text-fuchsia-300 mb-6">
            <Vote className="h-3 w-3" />
            Community Vote
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            What Do You Want to Learn?
          </h2>
          <p className="text-muted max-w-xl mx-auto mb-3">
            Vote for the topics you&apos;d love to see in upcoming sessions. Your votes directly
            shape what we teach.
          </p>
          {totalVotes > 0 && (
            <p className="text-sm font-medium text-fuchsia-400">
              {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} cast by the community
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-fuchsia-400 animate-spin" />
          </div>
        )}

        {/* Option cards */}
        {!loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {sorted.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
              return (
                <div
                  key={opt.id}
                  className={`group relative rounded-2xl border p-5 transition-all cursor-default hover:shadow-md animate-fade-in-up ${
                    opt.userVoted
                      ? "border-fuchsia-500/50 bg-fuchsia-500/10 shadow-fuchsia-500/10"
                      : "border-border/50 bg-card/50 hover:border-fuchsia-500/30"
                  }`}
                  style={{ animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{opt.emoji}</div>
                    {opt.userVoted && (
                      <CheckCircle2 className="h-5 w-5 text-fuchsia-400 shrink-0" />
                    )}
                  </div>

                  <h3 className="font-semibold mb-1">{opt.label}</h3>
                  <p className="text-xs text-muted mb-4 leading-relaxed">{opt.description}</p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>{opt.voteCount} vote{opt.voteCount !== 1 ? "s" : ""}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Vote button */}
                  <button
                    onClick={() => vote(opt.id)}
                    disabled={!!votingId || opt.userVoted}
                    className={`w-full flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-all ${
                      opt.userVoted
                        ? "bg-fuchsia-500/20 text-fuchsia-300 cursor-default"
                        : "bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-600/30 active:scale-95"
                    }`}
                  >
                    {votingId === opt.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className={`h-3.5 w-3.5 ${opt.userVoted ? "fill-fuchsia-400" : ""}`} />
                    )}
                    {opt.userVoted ? "Voted!" : "Vote"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Suggest a topic */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur overflow-hidden">
          <button
            onClick={() => { setShowSuggest((v) => !v); setSubmitted(false); }}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center">
                <Plus className="h-4 w-4 text-muted" />
              </div>
              <div>
                <p className="font-medium text-sm">Suggest a Topic</p>
                <p className="text-xs text-muted">Have an idea not listed above? Let us know!</p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted transition-transform ${showSuggest ? "rotate-180" : ""}`}
            />
          </button>

          {showSuggest && (
            <div className="px-6 pb-6 border-t border-border/40 pt-5">
              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-10 w-10 text-fuchsia-400 mx-auto mb-3" />
                  <p className="font-semibold mb-1">Thank you for your suggestion!</p>
                  <p className="text-sm text-muted">
                    Your idea is under review. Once approved, it will appear in the voting list.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Topic Name *</label>
                    <input
                      type="text"
                      maxLength={100}
                      placeholder="e.g. AI for Malayalam Typing"
                      value={form.label}
                      onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-fuchsia-500/50 focus:bg-card transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Description (optional)</label>
                    <textarea
                      rows={2}
                      maxLength={300}
                      placeholder="Briefly describe what you'd like to learn..."
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-fuchsia-500/50 focus:bg-card transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Your Name (optional)</label>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="Anonymous"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:border-fuchsia-500/50 focus:bg-card transition-all"
                    />
                  </div>
                  <button
                    onClick={submitSuggestion}
                    disabled={!form.label.trim() || submitting}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 text-sm transition-all"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
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
