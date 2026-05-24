"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Trash2, Loader2, RefreshCw, Plus, Send } from "lucide-react";

interface VoteOptionAdmin {
  id: string;
  label: string;
  description: string;
  emoji: string;
  isApproved: boolean;
  isCustom: boolean;
  submittedBy?: string;
  voteCount: number;
  createdAt: string;
}

interface Props {
  token: string;
}

const EMOJI_PICKS = ["🤖", "🖼️", "🎨", "📝", "🎥", "🔊", "💡", "🌟", "📊", "🗣️", "🧠", "✨"];

export default function VotesManager({ token }: Props) {
  const [options, setOptions] = useState<VoteOptionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ label: "", description: "", emoji: "🤖" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-for-everyone/votes/options", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOptions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setActioning(id);
    await fetch(`/api/ai-for-everyone/votes/options/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isApproved: true }),
    });
    setActioning(null);
    load();
  }

  async function reject(id: string) {
    setActioning(id);
    await fetch(`/api/ai-for-everyone/votes/options/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isApproved: false }),
    });
    setActioning(null);
    load();
  }

  async function addOption() {
    if (!addForm.label.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/ai-for-everyone/votes/options", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          label: addForm.label,
          description: addForm.description,
          emoji: addForm.emoji,
          submittedBy: "Admin",
        }),
      });
      const created = await res.json();
      if (created?.id) {
        await fetch(`/api/ai-for-everyone/votes/options/${created.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ isApproved: true }),
        });
      }
      setAddForm({ label: "", description: "", emoji: "🤖" });
      setShowAdd(false);
      load();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this option? All votes for it will also be deleted.")) return;
    setActioning(id);
    await fetch(`/api/ai-for-everyone/votes/options/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setActioning(null);
    load();
  }

  const approved = options.filter((o) => o.isApproved);
  const pending = options.filter((o) => !o.isApproved && o.isCustom);
  const totalVotes = approved.reduce((s, o) => s + o.voteCount, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Votes</h2>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 text-sm rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600/30 px-3 py-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Option
          </button>
        </div>
      </div>

      {/* Add new option form */}
      {showAdd && (
        <div className="mb-8 rounded-xl border border-violet-500/25 bg-violet-500/5 p-5">
          <h3 className="font-semibold mb-4 text-violet-300">Add New Vote Option</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1">Emoji</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {EMOJI_PICKS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setAddForm((f) => ({ ...f, emoji: e }))}
                    className={`text-xl rounded-lg px-2 py-1 transition-colors ${addForm.emoji === e ? "bg-violet-600/40 border border-violet-400" : "hover:bg-border/30"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Label *</label>
              <input
                type="text"
                maxLength={120}
                placeholder="e.g. AI for Social Media"
                value={addForm.label}
                onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Description (optional)</label>
              <input
                type="text"
                maxLength={200}
                placeholder="Brief description..."
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={addOption}
                disabled={!addForm.label.trim() || adding}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Add & Approve
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold">Pending Review</h3>
            <span className="rounded-full bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5">{pending.length}</span>
          </div>
          <div className="space-y-3">
            {pending.map((opt) => (
              <div key={opt.id} className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{opt.label}</p>
                    {opt.description && <p className="text-sm text-muted mt-0.5">{opt.description}</p>}
                    <p className="text-xs text-muted mt-1">
                      Submitted by: <span className="text-amber-300">{opt.submittedBy ?? "Anonymous"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => approve(opt.id)}
                      disabled={actioning === opt.id}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 text-xs transition-colors"
                    >
                      {actioning === opt.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => remove(opt.id)}
                      disabled={actioning === opt.id}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved options */}
      <div>
        <h3 className="font-semibold mb-3">
          Approved Options
          {totalVotes > 0 && <span className="text-sm font-normal text-muted ml-2">· {totalVotes} total votes</span>}
        </h3>
        {approved.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm rounded-xl border border-border/30">
            No approved options yet
          </div>
        ) : (
          <div className="space-y-3">
            {[...approved].sort((a, b) => b.voteCount - a.voteCount).map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
              return (
                <div key={opt.id} className="rounded-xl border border-border/50 bg-card/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{opt.label}</p>
                        {opt.isCustom && (
                          <span className="text-xs rounded-full bg-violet-500/20 text-violet-400 px-2 py-0.5">custom</span>
                        )}
                      </div>
                      {opt.description && <p className="text-xs text-muted mt-0.5">{opt.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold">{opt.voteCount}</span>
                      <span className="text-xs text-muted">votes</span>
                      <button
                        onClick={() => reject(opt.id)}
                        disabled={actioning === opt.id}
                        title="Unapprove (hide from voting)"
                        className="p-1.5 rounded-lg hover:bg-border/30 text-muted hover:text-foreground transition-colors"
                      >
                        {actioning === opt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => remove(opt.id)}
                        disabled={actioning === opt.id}
                        title="Delete permanently"
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="h-1.5 rounded-full bg-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">{pct}% of votes</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
