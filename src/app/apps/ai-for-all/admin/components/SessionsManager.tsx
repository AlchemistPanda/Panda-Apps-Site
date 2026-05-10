"use client";

import { useState, useRef, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Check, Calendar, Upload, ImageIcon, Crop } from "lucide-react";
import Cropper, { Point, Area } from "react-easy-crop";
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
  token,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  loading: boolean;
  token: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [topicsInput, setTopicsInput] = useState(initial.topics.join(", "));
  const [appsInput, setAppsInput] = useState(
    initial.appsToDownload.map((a) => `${a.name}|${a.url}`).join("\n")
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
      const res = await fetch("/api/ai-for-all/upload", {
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
      const res = await fetch("/api/ai-for-all/sessions", {
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
      const res = await fetch(`/api/ai-for-all/sessions/${id}`, {
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
          token={token}
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
                token={token}
              />
            )}
          </div>
        ))}
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
