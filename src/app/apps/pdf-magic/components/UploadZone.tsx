"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, AlertTriangle } from "lucide-react";
import type { ConversionMode } from "../lib/types";
import type { I18nStrings } from "../lib/types";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  mode: ConversionMode;
  onModeChange: (mode: ConversionMode) => void;
  t: I18nStrings;
  disabled?: boolean;
}

export default function UploadZone({ onFileSelected, mode, onModeChange, t, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError("");
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be under 50 MB.");
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-12 sm:p-16 text-center
          transition-all duration-300 group
          ${isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border/50 hover:border-accent/40 hover:bg-card/40"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative flex flex-col items-center gap-4">
          <div className={`
            h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${isDragging ? "bg-accent/20 scale-110" : "bg-card/60 border border-border/40 group-hover:bg-accent/10 group-hover:border-accent/30"}
          `}>
            {isDragging ? (
              <FileText className="h-8 w-8 text-accent animate-bounce" />
            ) : (
              <Upload className="h-8 w-8 text-muted group-hover:text-accent transition-colors" />
            )}
          </div>

          <div>
            <p className="text-lg font-semibold mb-1">
              {isDragging ? "Drop it!" : t.dropHere}
            </p>
            <p className="text-sm text-muted">{t.orClickBrowse}</p>
          </div>

          <p className="text-xs text-muted/60">{t.maxSize}</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          disabled={disabled}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Mode selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onModeChange("quick")}
          className={`flex-1 rounded-xl border px-4 py-3.5 text-left transition-all ${
            mode === "quick"
              ? "border-accent/50 bg-accent/10 shadow-lg shadow-accent/5"
              : "border-border/40 bg-card/30 hover:border-border/60"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚡</span>
            <span className={`text-sm font-semibold ${mode === "quick" ? "text-accent" : ""}`}>
              {t.quickMode}
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">{t.quickModeDesc}</p>
        </button>

        <button
          onClick={() => onModeChange("ai")}
          className={`flex-1 rounded-xl border px-4 py-3.5 text-left transition-all ${
            mode === "ai"
              ? "border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/5"
              : "border-border/40 bg-card/30 hover:border-border/60"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🤖</span>
            <span className={`text-sm font-semibold ${mode === "ai" ? "text-violet-400" : ""}`}>
              {t.aiMode}
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">{t.aiModeDesc}</p>
        </button>
      </div>

      {mode === "ai" && (
        <p className="text-xs text-amber-400/70 flex items-center gap-1.5 px-1">
          <AlertTriangle className="h-3 w-3" />
          {t.privacyNote}
        </p>
      )}
    </div>
  );
}
