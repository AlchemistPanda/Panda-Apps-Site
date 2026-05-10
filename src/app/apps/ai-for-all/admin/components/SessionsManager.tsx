"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Check, Calendar } from "lucide-react";
import type { Session } from "@/lib/ai4all";

interface Props {
  sessions: Session[];
  token: string;
  onRefresh: () => void;
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
];

type FormState = Omit<Session, "id" | "createdAt">;

const EMPTY: FormState = {
  title: "",
  description: "",
  scheduledDate: null,
  durationMinutes: 90,
  topics: [],
  isRegistrationOpen: false,
  maxParticipants: null,
  whatsappLink: "",
  appsToDownload: [],
  coverImageUrl: "",
  coverGradient: GRADIENTS[0],
  isPublished: true,
};

function SessionForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [topicsInput, setTopicsInput] = useState(initial.topics.join(", "));
  const [appsInput, setAppsInput] = useState(
    initial.appsToDownload.map((a) => `${a.name}|${a.url}`).join("\n")
  );

  function submit() {
    const topics = topicsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const apps = appsInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, url] = l.split("|");
        return { name: name?.trim() ?? "", url: url?.trim() ?? "" };
      })
      .filter((a) => a.name && a.url);

    onSave({ ...form, topics, appsToDownload: apps });
  }

  const input =
    "w-full rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-all";

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-card/60 backdrop-blur p-6 mb-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">Session Title *</label>
          <input
            className={input}
            placeholder="e.g. AI Image Generation for Teachers"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">Description</label>
          <textarea
            rows={3}
            className={`${input} resize-none`}
            placeholder="What will participants learn in this session?"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Date & Time</label>
          <input
            type="datetime-local"
            className={input}
            value={form.scheduledDate ? form.scheduledDate.slice(0, 16) : ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                scheduledDate: e.target.value ? new Date(e.target.value).toISOString() : null,
              }))
            }
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Duration (minutes)</label>
          <input
            type="number"
            className={input}
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 90 }))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Max Participants</label>
          <input
            type="number"
            className={input}
            placeholder="Leave blank for unlimited"
            value={form.maxParticipants ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxParticipants: e.target.value ? parseInt(e.target.value) : null }))
            }
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Cover Gradient</label>
          <div className="flex gap-2 flex-wrap">
            {GRADIENTS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm((f) => ({ ...f, coverGradient: g }))}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} transition-all ${
                  form.coverGradient === g ? "ring-2 ring-white ring-offset-2 ring-offset-card" : ""
                }`}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">Topics (comma-separated)</label>
          <input
            className={input}
            placeholder="Image Generation, Poster Design, AI Basics"
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">WhatsApp Community Link</label>
          <input
            className={input}
            placeholder="https://chat.whatsapp.com/..."
            value={form.whatsappLink}
            onChange={(e) => setForm((f) => ({ ...f, whatsappLink: e.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">
            Apps to Download (one per line: <code className="text-violet-400">AppName|https://...</code>)
          </label>
          <textarea
            rows={3}
            className={`${input} resize-none font-mono text-xs`}
            placeholder={"Canva|https://www.canva.com\nChatGPT|https://chat.openai.com"}
            value={appsInput}
            onChange={(e) => setAppsInput(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted mb-1">Cover Image URL (optional)</label>
          <input
            className={input}
            placeholder="https://example.com/image.jpg"
            value={form.coverImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRegistrationOpen}
              onChange={(e) => setForm((f) => ({ ...f, isRegistrationOpen: e.target.checked }))}
              className="accent-violet-500 w-4 h-4"
            />
            <span className="text-sm">Registration Open</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="accent-violet-500 w-4 h-4"
            />
            <span className="text-sm">Published</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={submit}
          disabled={!form.title.trim() || loading}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold px-5 py-2 text-sm transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Session
        </button>
      </div>
    </div>
  );
}

export default function SessionsManager({ sessions, token, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  async function createSession(data: FormState) {
    setSaving(true);
    try {
      await fetch("/api/ai-for-all/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      setShowForm(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function updateSession(id: string, data: FormState) {
    setSaving(true);
    try {
      await fetch(`/api/ai-for-all/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      setEditId(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await fetch(`/api/ai-for-all/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  }

  async function toggleRegistration(session: Session) {
    setToggling(session.id);
    await fetch(`/api/ai-for-all/sessions/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isRegistrationOpen: !session.isRegistrationOpen }),
    });
    setToggling(null);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Sessions</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium px-4 py-2 text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> New Session
        </button>
      </div>

      {showForm && !editId && (
        <SessionForm
          initial={EMPTY}
          onSave={createSession}
          onCancel={() => setShowForm(false)}
          loading={saving}
        />
      )}

      {sessions.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted text-sm rounded-2xl border border-border/30">
          No sessions yet. Create your first session!
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((s) => (
          <div key={s.id}>
            <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
              <div className={`h-1 w-full bg-gradient-to-r ${s.coverGradient}`} />
              <div className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs rounded-full px-2.5 py-1 ${s.isRegistrationOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-border/30 text-muted"}`}>
                        {s.isRegistrationOpen ? "Open" : "Closed"}
                      </span>
                      {!s.isPublished && (
                        <span className="text-xs rounded-full px-2.5 py-1 bg-amber-500/20 text-amber-400">Draft</span>
                      )}
                    </div>
                    <h3 className="font-semibold">{s.title}</h3>
                    {s.scheduledDate && (
                      <p className="text-xs text-muted mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(s.scheduledDate).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleRegistration(s)}
                      disabled={toggling === s.id}
                      title={s.isRegistrationOpen ? "Close registration" : "Open registration"}
                      className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted hover:text-foreground"
                    >
                      {toggling === s.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : s.isRegistrationOpen
                        ? <ToggleRight className="h-4 w-4 text-emerald-400" />
                        : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => { setEditId(s.id); setShowForm(false); }}
                      className="p-2 rounded-lg hover:bg-card-hover transition-colors text-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {editId === s.id && (
              <SessionForm
                initial={{ ...s }}
                onSave={(data) => updateSession(s.id, data)}
                onCancel={() => setEditId(null)}
                loading={saving}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
