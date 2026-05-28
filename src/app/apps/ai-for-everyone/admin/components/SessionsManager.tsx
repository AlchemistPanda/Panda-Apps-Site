"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Check, Calendar, Upload, ImageIcon, Crop, ChevronDown, ChevronUp, Users, CheckCircle, AlertCircle, User } from "lucide-react";
import Cropper, { Point, Area } from "react-easy-crop";
import { Session, Registration, getSessionStatus } from "@/lib/ai4all";

function extractOcrAmount(reason?: string): number | null {
  if (!reason) return null;
  const match = reason.match(/in\s*receipt\s*\(?₹?([0-9,]+)/i);
  if (match && match[1]) {
    return parseInt(match[1].replace(/,/g, ""), 10);
  }
  return null;
}

function getEffectiveDonationAmount(r: Registration): number {
  if (r.donationStatus !== "donated") return 0;
  if (r.isScreenshotCorrect === true || r.isScreenshotCorrect === false) {
    return Number(r.donationAmount ?? 50);
  }
  const detected = extractOcrAmount(r.autoVerifiedReason);
  if (detected !== null) return detected;
  return Number(r.donationAmount ?? 50);
}

function formatToLocalDatetime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

interface Props {
  sessions: Session[];
  registrations: Registration[];
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
  status: "closed",
  maxParticipants: null,
  whatsappLink: "",
  appsToDownload: [],
  coverImageUrl: "",
  coverGradient: GRADIENTS[0],
  isPublished: true,
  speaker: "",
};

function SessionForm({
  initial,
  onSave,
  onCancel,
  loading,
  token,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  loading: boolean;
  token: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [dateInput, setDateInput] = useState(formatToLocalDatetime(initial.scheduledDate));
  const [durationInput, setDurationInput] = useState((initial.durationMinutes ?? 90).toString());
  const [topicsInput, setTopicsInput] = useState((initial.topics || []).join(", "));
  const [appsInput, setAppsInput] = useState(
    (initial.appsToDownload || []).map((a) => `${a.name}|${a.url}`).join("\n")
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ai-for-everyone/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { /* not JSON */ }
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }
      setForm((f) => ({ ...f, coverImageUrl: data.url }));
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCropImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setCropImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

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

    let scheduledDate: string | null = null;
    if (dateInput) {
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        scheduledDate = parsedDate.toISOString();
      }
    }

    const durationMinutes = parseInt(durationInput, 10) || 90;

    onSave({ 
      ...form, 
      topics, 
      appsToDownload: apps, 
      scheduledDate, 
      durationMinutes 
    });
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
            placeholder="e.g. AI Image Generation for Everyone"
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
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Duration (minutes)</label>
          <input
            type="text"
            className={input}
            placeholder="e.g. 90"
            value={durationInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, ""); // Allow only digits
              setDurationInput(val);
            }}
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
          <label className="block text-xs text-muted mb-1">Instructor / Speaker Name</label>
          <input
            className={input}
            placeholder="e.g. Manuraj V R or Sindhu Sudhakaran"
            value={form.speaker ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, speaker: e.target.value }))
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
          <label className="block text-xs text-muted mb-1">Cover Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFilePick}
            className="hidden"
          />
          
          {form.coverImageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.coverImageUrl}
                alt="Cover preview"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverImageUrl: "" }))}
                  className="px-3 py-1.5 rounded-lg bg-red-500/40 backdrop-blur text-white text-xs font-medium hover:bg-red-500/60 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-border/50 hover:border-violet-500/30 hover:bg-violet-500/5"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                  <p className="text-sm text-muted">Uploading & compressing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium">Drop an image here or click to browse</p>
                  <p className="text-xs text-muted">JPG, PNG, WebP · Max 10MB · Auto-compressed</p>
                </div>
              )}
            </div>
          )}
          
          {uploadError && (
            <p className="text-red-400 text-xs mt-2">{uploadError}</p>
          )}
        </div>

        {cropImage && (
          <CropModal
            image={cropImage}
            onCancel={() => setCropImage(null)}
            onCrop={(blob) => {
              setCropImage(null);
              uploadImage(new File([blob], "cover.jpg", { type: "image/jpeg" }));
            }}
          />
        )}
        <div className="w-full grid sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs text-muted mb-1 font-semibold">Session Status</label>
            <select
              className={input}
              value={form.status || (form.isRegistrationOpen ? "open" : "closed")}
              onChange={(e) => {
                const s = e.target.value as 'open' | 'closed' | 'coming_soon' | 'seats_filled';
                setForm((f) => ({
                  ...f,
                  status: s,
                  isRegistrationOpen: s === "open",
                }));
              }}
            >
              <option value="open">🟢 Live / Registration Open</option>
              <option value="coming_soon">🟡 Coming Soon</option>
              <option value="seats_filled">🔴 Seats Filled</option>
              <option value="closed">⚪ Closed</option>
            </select>
          </div>
          <div className="flex items-center pt-5 sm:pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="accent-violet-500 w-4 h-4"
              />
              <span className="text-sm font-medium">Published (Visible on site)</span>
            </label>
          </div>
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

export default function SessionsManager({ sessions, registrations, token, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  async function createSession(data: FormState) {
    setSaving(true);
    try {
      const res = await fetch("/api/ai-for-everyone/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const text = await res.text();
      let resData: any = null;
      try { resData = JSON.parse(text); } catch { /* not JSON */ }

      if (!res.ok || resData?.error) {
        throw new Error(
          resData?.error ||
          `Server returned ${res.status}: ${text.slice(0, 300) || "(empty body)"}`
        );
      }
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      alert(`Error creating session:\n\n${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function updateSession(id: string, data: FormState) {
    setSaving(true);
    try {
      const res = await fetch(`/api/ai-for-everyone/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const text = await res.text();
      let resData: any = null;
      try { resData = JSON.parse(text); } catch { /* not JSON */ }

      if (!res.ok || resData?.error) {
        throw new Error(
          resData?.error ||
          `Server returned ${res.status}: ${text.slice(0, 300) || "(empty body)"}`
        );
      }
      setEditId(null);
      onRefresh();
    } catch (e: any) {
      alert(`Error updating session:\n\n${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await fetch(`/api/ai-for-everyone/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  }

  async function toggleRegistration(session: Session) {
    setToggling(session.id);
    await fetch(`/api/ai-for-everyone/sessions/${session.id}`, {
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
          token={token}
        />
      )}

      {sessions.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted text-sm rounded-2xl border border-border/30">
          No sessions yet. Create your first session!
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((s) => {
          const sessionRegs = registrations.filter((r) => r.sessionId === s.id);
          const verifiedAmount = sessionRegs
            .filter((r) => r.donationStatus === "donated" && r.isScreenshotCorrect === true)
            .reduce((sum, r) => sum + getEffectiveDonationAmount(r), 0);
          const pendingCount = sessionRegs
            .filter((r) => r.donationStatus === "donated" && r.isScreenshotCorrect === undefined)
            .length;

          return (
            <div key={s.id}>
              <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
                <div className={`h-1 w-full bg-gradient-to-r ${s.coverGradient}`} />
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(() => {
                          const statusInfo = getSessionStatus(s);
                          return (
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                        {!s.isPublished && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">Draft</span>
                        )}
                        {s.isArchived && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 bg-slate-500/20 text-slate-450 rounded-full border border-slate-500/30 font-semibold">Archived (Deleted)</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{s.title}</h3>
                      {s.scheduledDate && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1 text-xs text-muted">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(s.scheduledDate).toLocaleString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                          {s.speaker && (
                            <p className="flex items-center gap-1 text-violet-400 font-semibold">
                              <User className="h-3.5 w-3.5" />
                              <span>Led by {s.speaker}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Dynamic Stats Badges */}
                      <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                        <span className="bg-white/5 border border-border/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium text-muted">
                          <Users className="h-3 w-3 text-violet-400" /> {sessionRegs.length} registered
                        </span>
                        {verifiedAmount > 0 && (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium text-emerald-400">
                            <CheckCircle className="h-3 w-3 text-emerald-400" /> ₹{verifiedAmount.toLocaleString("en-IN")} verified collected
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium text-amber-400 animate-pulse">
                            <AlertCircle className="h-3 w-3 text-amber-400" /> {pendingCount} pending verification
                          </span>
                        )}
                      </div>
                      {s.maxParticipants && (
                        <div className="mt-3.5 max-w-[240px]">
                          <div className="flex items-center justify-between text-[10px] text-muted mb-1 font-semibold">
                            <span>Capacity</span>
                            <span>{sessionRegs.length} / {s.maxParticipants} filled</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-border/20">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                (sessionRegs.length / s.maxParticipants) >= 0.95 
                                  ? "bg-gradient-to-r from-rose-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                  : (sessionRegs.length / s.maxParticipants) >= 0.8
                                  ? "bg-gradient-to-r from-orange-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                                  : "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                              }`}
                              style={{ width: `${Math.min(100, Math.round((sessionRegs.length / s.maxParticipants) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 self-stretch sm:self-auto">
                      {!s.isArchived && (
                        <div className="flex items-center gap-2">
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
                      )}

                      <button
                        onClick={() => setExpandedSessionId(expandedSessionId === s.id ? null : s.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/50 hover:bg-card-hover hover:text-foreground transition-all text-xs font-bold text-muted"
                      >
                        {expandedSessionId === s.id ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" /> Hide Registrants ({sessionRegs.length})
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" /> View Registrants ({sessionRegs.length})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Registrants list */}
                {expandedSessionId === s.id && (
                  <div className="border-t border-border/40 bg-black/25 px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
                        Registrants for this session
                      </h4>
                      <span className="text-[10px] text-muted">
                        Showing {sessionRegs.length} registrants
                      </span>
                    </div>

                    {sessionRegs.length === 0 ? (
                      <div className="text-center py-6 text-muted text-xs">
                        No registrants for this session yet
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {sessionRegs.map((r) => {
                          const isVerified = r.isScreenshotCorrect === true;
                          const isInvalid = r.isScreenshotCorrect === false;
                          
                          // Dynamically parse OCR amount for unverified records
                          const detected = !isVerified && !isInvalid ? extractOcrAmount(r.autoVerifiedReason) : null;
                          const displayAmount = detected ? detected : (r.donationAmount ?? 50);
                          const selectedAmt = detected ? (r.donationAmount ?? 50) : r.userSelectedAmount;
                          
                          return (
                            <div
                              key={r.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/40 bg-card/60 gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">{r.name}</span>
                                  {r.donationStatus === "donated" && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                      isVerified
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : isInvalid
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                      ₹{displayAmount}{selectedAmt ? ` (Selected ₹${selectedAmt})` : ""} {isVerified ? "Verified" : isInvalid ? "Invalid Proof" : "Unverified"}
                                    </span>
                                  )}
                                  {r.donationStatus === "hardship" && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      Financial Aid
                                    </span>
                                  )}
                                  {r.donationStatus === "skipped" && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/5 text-muted border border-border/20">
                                      Skipped
                                    </span>
                                  )}
                                </div>
                                <p className="text-muted text-[11px]">
                                  Phone: <strong className="text-foreground/90">{r.phone}</strong> · WhatsApp: <strong className="text-foreground/90">{r.whatsapp}</strong>
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  <button
                                    onClick={() => {
                                      const cleanPhone = r.whatsapp.replace(/\D/g, "");
                                      const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
                                        ? cleanPhone
                                        : cleanPhone.length === 10
                                        ? `91${cleanPhone}`
                                        : cleanPhone;
                                      const msg = `ഹലോ ${r.name}, AI for Everyone സെഷനിലേക്ക് താങ്കളുടെ രജിസ്ട്രേഷൻ വിജയകരമായി പൂർത്തിയായിരിക്കുന്നു! 🤖✨\n\nക്ലാസ്സ് വിവരങ്ങൾക്കും ലിങ്കുകൾക്കുമായി ദയവായി താഴെ കാണുന്ന ഔദ്യോഗിക വാട്സാപ്പ് ഗ്രൂപ്പിൽ ജോയിൻ ചെയ്യുക:\n👉 ${s.whatsappLink || "https://chat.whatsapp.com/..."}\n\nസെഷനിൽ കാണാം! 🤝`;
                                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-[10px] font-bold text-emerald-400 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    💬 ML Invite
                                  </button>
                                  <button
                                    onClick={() => {
                                      const cleanPhone = r.whatsapp.replace(/\D/g, "");
                                      const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
                                        ? cleanPhone
                                        : cleanPhone.length === 10
                                        ? `91${cleanPhone}`
                                        : cleanPhone;
                                      const msg = `Hi ${r.name}, your registration for the AI for Everyone session "${s.title}" is successfully confirmed! 🤖✨\n\nTo receive session updates and links, please join our official WhatsApp Group here:\n👉 ${s.whatsappLink || "https://chat.whatsapp.com/..."}\n\nSee you in the session! 🤝`;
                                      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600 hover:text-white text-[10px] font-bold text-violet-400 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    💬 EN Invite
                                  </button>
                                </div>
                                {r.whyJoin && (
                                  <p className="text-muted/80 text-[10px] italic leading-snug line-clamp-1 mt-0.5">
                                    "{r.whyJoin}"
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {r.screenshotUrl && (
                                  <a
                                    href={r.screenshotUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded bg-white/5 border border-border/50 hover:bg-white/10 text-[10px] font-bold text-muted hover:text-foreground transition-all"
                                  >
                                    View Receipt ↗
                                  </a>
                                )}
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete ${r.name}'s registration? This cannot be undone.`)) return;
                                    try {
                                      const res = await fetch(`/api/ai-for-everyone/registrations/${r.id}`, {
                                        method: "DELETE",
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      if (!res.ok) throw new Error("Delete failed");
                                      onRefresh();
                                    } catch (e: any) {
                                      alert(e.message || "Error deleting registration");
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500 hover:text-white transition-all"
                                  title="Delete Registration"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editId === s.id && (
                <SessionForm
                  initial={{ ...s }}
                  onSave={(data) => updateSession(s.id, data)}
                  onCancel={() => setEditId(null)}
                  loading={saving}
                  token={token}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/jpeg", 0.9);
  });
}

function CropModal({
  image,
  onCrop,
  onCancel,
}: {
  image: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, b: Area) => {
    setCroppedAreaPixels(b);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
      <div className="w-full max-w-2xl bg-[#030014] rounded-2xl border border-violet-500/30 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl shadow-violet-500/20">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Crop className="h-4 w-4 text-violet-400" />
            Adjust Image
          </h3>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative flex-1 bg-black min-h-[400px]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted font-medium">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-violet-500/20 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-border/50 hover:bg-white/5 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (croppedAreaPixels) {
                  try {
                    const blob = await getCroppedImg(image, croppedAreaPixels);
                    onCrop(blob);
                  } catch (e) {
                    alert("Failed to crop image");
                  }
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-95"
            >
              Apply Adjustment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
