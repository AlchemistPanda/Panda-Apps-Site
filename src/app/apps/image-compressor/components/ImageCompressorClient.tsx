"use client";

import { useState, useCallback, useRef } from "react";
import {
  Image, ArrowLeft, Sparkles, Settings2,
  Download, Trash2, PackageOpen, Loader2
} from "lucide-react";
import Link from "next/link";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import DropZone from "./DropZone";
import FileCard from "./FileCard";
import SettingsPanel from "./SettingsPanel";
import { DEFAULT_SETTINGS, formatBytes, savingsPercent } from "../types";
import type { CompressionSettings, CompressedFile } from "../types";
import { compressImage, mimeToExtension } from "../compress";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ImageCompressorClient() {
  const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_SETTINGS);
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSettings = useCallback((partial: Partial<CompressionSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Add files (deduplicate by name+size) ────────────────────────────
  const handleNewFiles = useCallback(
    async (incoming: File[]) => {
      if (isProcessing) return;

      const currentSettings = settingsRef.current;

      // Auto-switch to High error correction mode hint (not applicable here)
      const newEntries: CompressedFile[] = incoming.map((f) => ({
        id: uid(),
        originalFile: f,
        originalSize: f.size,
        originalUrl: URL.createObjectURL(f),
        compressedBlob: null,
        compressedUrl: null,
        compressedSize: null,
        status: "pending" as const,
        error: null,
        outputFormat:
          currentSettings.outputFormat === "original"
            ? f.type
            : `image/${currentSettings.outputFormat}`,
      }));

      setFiles((prev) => [...prev, ...newEntries]);
      setIsProcessing(true);

      // Process each file
      for (const entry of newEntries) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: "compressing" } : f
          )
        );

        try {
          const { blob, mime } = await compressImage(
            entry.originalFile,
            currentSettings,
            (p) => {
              setProgress((prev) => ({ ...prev, [entry.id]: p }));
            }
          );

          const url = URL.createObjectURL(blob);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: "done",
                    compressedBlob: blob,
                    compressedUrl: url,
                    compressedSize: blob.size,
                    outputFormat: mime,
                  }
                : f
            )
          );
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: "error",
                    error:
                      err instanceof Error ? err.message : "Compression failed",
                  }
                : f
            )
          );
        }

        setProgress((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [entry.id]: _, ...rest } = prev;
          return rest;
        });
      }

      setIsProcessing(false);
    },
    [isProcessing]
  );

  // ── Download single file ─────────────────────────────────────────────
  const handleDownload = useCallback((file: CompressedFile) => {
    if (!file.compressedBlob) return;
    const ext = mimeToExtension(file.outputFormat);
    const baseName = file.originalFile.name.replace(/\.[^/.]+$/, "");
    saveAs(file.compressedBlob, `${baseName}-compressed.${ext}`);
  }, []);

  // ── Download all as ZIP ──────────────────────────────────────────────
  const handleDownloadAll = useCallback(async () => {
    const done = files.filter((f) => f.status === "done" && f.compressedBlob);
    if (!done.length) return;

    const zip = new JSZip();
    const folder = zip.folder("panda-compressed")!;

    done.forEach((f) => {
      const ext = mimeToExtension(f.outputFormat);
      const baseName = f.originalFile.name.replace(/\.[^/.]+$/, "");
      folder.file(`${baseName}-compressed.${ext}`, f.compressedBlob!);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "panda-compressed-images.zip");
  }, [files]);

  // ── Remove file ──────────────────────────────────────────────────────
  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f?.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f?.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    files.forEach((f) => {
      if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
    });
    setFiles([]);
  }, [files]);

  // ── Recompress all with new settings ────────────────────────────────
  const handleRecompress = useCallback(async () => {
    if (isProcessing) return;
    const filesToProcess = files.filter(
      (f) => f.status === "done" || f.status === "error"
    );
    if (!filesToProcess.length) return;

    setIsProcessing(true);

    // Reset all to pending
    setFiles((prev) =>
      prev.map((f) =>
        filesToProcess.find((x) => x.id === f.id)
          ? {
              ...f,
              status: "pending",
              compressedBlob: null,
              compressedUrl: null,
              compressedSize: null,
              error: null,
              outputFormat:
                settingsRef.current.outputFormat === "original"
                  ? f.originalFile.type
                  : `image/${settingsRef.current.outputFormat}`,
            }
          : f
      )
    );

    for (const entry of filesToProcess) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id ? { ...f, status: "compressing" } : f
        )
      );

      try {
        const { blob, mime } = await compressImage(
          entry.originalFile,
          settingsRef.current,
          (p) => setProgress((prev) => ({ ...prev, [entry.id]: p }))
        );
        const url = URL.createObjectURL(blob);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? {
                  ...f,
                  status: "done",
                  compressedBlob: blob,
                  compressedUrl: url,
                  compressedSize: blob.size,
                  outputFormat: mime,
                }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? {
                  ...f,
                  status: "error",
                  error: err instanceof Error ? err.message : "Compression failed",
                }
              : f
          )
        );
      }

      setProgress((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [entry.id]: _, ...rest } = prev;
        return rest;
      });
    }

    setIsProcessing(false);
  }, [files, isProcessing]);

  // ── Stats ────────────────────────────────────────────────────────────
  const doneFiles = files.filter((f) => f.status === "done" && f.compressedSize != null);
  const totalOriginal = doneFiles.reduce((s, f) => s + f.originalSize, 0);
  const totalCompressed = doneFiles.reduce((s, f) => s + (f.compressedSize ?? 0), 0);
  const totalSaving = savingsPercent(totalOriginal, totalCompressed);

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ── Header ── */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Apps
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                <Image className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Image Compressor</h1>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    Free
                  </span>
                </div>
                <p className="text-sm text-muted mt-0.5">
                  Compress images with intelligent algorithms — no quality loss. Your images never leave your device.
                </p>
              </div>
            </div>

            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                showSettings
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                  : "border-border/50 bg-card/30 text-muted hover:text-foreground hover:bg-card/50"
              }`}
            >
              <Settings2 className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left: Settings (collapsible) ── */}
          {showSettings && (
            <div className="lg:col-span-4">
              <div className="rounded-2xl border border-border/50 bg-card/30 p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
                    Compression Settings
                  </h2>
                </div>
                <SettingsPanel settings={settings} onChange={updateSettings} />

                {/* Apply to existing */}
                {files.length > 0 && (
                  <button
                    onClick={handleRecompress}
                    disabled={isProcessing}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Re-compress with new settings
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Right: Upload + Files ── */}
          <div className={showSettings ? "lg:col-span-8" : "lg:col-span-12"}>

            {/* Drop zone */}
            <DropZone onFiles={handleNewFiles} disabled={isProcessing} />

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* Stats bar */}
                {doneFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard label="Files" value={`${doneFiles.length}`} color="text-foreground" />
                    <StatCard label="Original" value={formatBytes(totalOriginal)} color="text-muted" />
                    <StatCard label="Compressed" value={formatBytes(totalCompressed)} color="text-blue-400" />
                    <StatCard
                      label="Saved"
                      value={totalSaving > 0 ? `-${totalSaving}%` : "0%"}
                      color={totalSaving >= 30 ? "text-green-400" : totalSaving > 0 ? "text-blue-400" : "text-muted"}
                    />
                  </div>
                )}

                {/* Action bar */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">
                    {files.length} file{files.length !== 1 ? "s" : ""}
                    {isProcessing && (
                      <span className="ml-2 inline-flex items-center gap-1 text-blue-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        processing…
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {doneFiles.length > 1 && (
                      <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
                      >
                        <PackageOpen className="h-3.5 w-3.5" />
                        Download All ZIP
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      disabled={isProcessing}
                      className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-4 py-2 text-xs font-medium text-muted hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All
                    </button>
                  </div>
                </div>

                {/* File cards */}
                <div className="space-y-3">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      progress={progress[file.id] ?? 0}
                      onRemove={handleRemove}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Algorithm info ── */}
        <div className="mt-16 rounded-2xl border border-border/30 bg-card/20 p-8">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            How the compression works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            {[
              {
                step: "01",
                title: "Smart Resize",
                desc: "Downscales only when needed to hit the target dimension, preserving aspect ratio perfectly.",
              },
              {
                step: "02",
                title: "Iterative Encoding",
                desc: "Runs multiple encode passes to find the exact quality level that satisfies your target — no guessing.",
              },
              {
                step: "03",
                title: "Canvas Re-encode",
                desc: "A final Canvas API pass fine-tunes the output format (WebP/AVIF/JPEG) and picks the smaller of both results.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="text-2xl font-black text-border/40 font-mono">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-muted text-xs mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-300/80">
            🔒 <strong>Your images are 100% safe</strong> — nothing is uploaded to any server. Everything happens right here on your device, completely private.
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/30 p-4 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}
