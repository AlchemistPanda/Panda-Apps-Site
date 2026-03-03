"use client";

import { FORMAT_OPTIONS, MODE_OPTIONS } from "../types";
import type { CompressionSettings, OutputFormat, CompressionMode } from "../types";
import { Info } from "lucide-react";

interface Props {
  settings: CompressionSettings;
  onChange: (s: Partial<CompressionSettings>) => void;
}

export default function SettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">

      {/* ── Compression Mode ── */}
      <Section title="Compression Mode">
        <div className="space-y-2">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => onChange({ mode: m.value as CompressionMode })}
              className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                settings.mode === m.value
                  ? "border-blue-500/40 bg-blue-500/8"
                  : "border-border/40 bg-card/20 hover:bg-card/40"
              }`}
            >
              <div
                className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors ${
                  settings.mode === m.value
                    ? "border-blue-400 bg-blue-400"
                    : "border-border"
                }`}
              />
              <div>
                <p className={`text-sm font-semibold ${settings.mode === m.value ? "text-blue-300" : "text-foreground"}`}>
                  {m.label}
                </p>
                <p className="text-[11px] text-muted mt-0.5">{m.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Output Format ── */}
      <Section title="Output Format">
        <div className="grid grid-cols-5 gap-2">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ outputFormat: f.value as OutputFormat })}
              className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                settings.outputFormat === f.value
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                  : "border-border/40 bg-card/20 text-muted hover:bg-card/40 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {settings.outputFormat === "webp" && (
          <Tip>WebP gives 25–35% smaller files than JPEG at the same quality — recommended for web.</Tip>
        )}
        {settings.outputFormat === "avif" && (
          <Tip>AVIF gives up to 50% smaller files but encoding is slower and browser support is still growing.</Tip>
        )}
      </Section>

      {/* ── Quality ── (hidden in lossless mode) */}
      {settings.mode !== "lossless" && (
        <Section title={`Quality: ${settings.quality}%`}>
          <input
            type="range"
            min={30}
            max={100}
            step={1}
            value={settings.quality}
            onChange={(e) => onChange({ quality: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>Smallest file</span>
            <span>
              {settings.quality <= 60 ? "High compression" :
               settings.quality <= 79 ? "Balanced" :
               settings.quality <= 90 ? "High quality" : "Near lossless"}
            </span>
            <span>Best quality</span>
          </div>
        </Section>
      )}

      {/* ── Target File Size ── */}
      <Section title="Target File Size">
        <div className="space-y-3">
          {/* Toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm text-foreground font-medium">Enable target size</span>
              <p className="text-[11px] text-muted">Algorithm finds the highest quality that fits</p>
            </div>
            <div
              onClick={() =>
                onChange({
                  targetSizeKB: settings.targetSizeKB != null ? null : 500,
                })
              }
              className={`relative h-5 w-9 rounded-full border transition-colors cursor-pointer flex-shrink-0 ${
                settings.targetSizeKB != null
                  ? "bg-blue-500 border-blue-500"
                  : "bg-card border-border/50"
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  settings.targetSizeKB != null ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>

          {/* Presets + input */}
          {settings.targetSizeKB != null && (
            <div className="space-y-2">
              {/* Quick presets */}
              <div className="flex flex-wrap gap-1.5">
                {[100, 200, 500, 1024, 2048].map((kb) => (
                  <button
                    key={kb}
                    onClick={() => onChange({ targetSizeKB: kb })}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      settings.targetSizeKB === kb
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                        : "border-border/40 bg-card/20 text-muted hover:bg-card/40"
                    }`}
                  >
                    {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={51200}
                  step={10}
                  value={settings.targetSizeKB}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v > 0) onChange({ targetSizeKB: v });
                  }}
                  className="w-full rounded-xl border border-border/40 bg-card/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50 focus:bg-card/50"
                  placeholder="Custom KB"
                />
                <span className="text-xs text-muted flex-shrink-0">KB</span>
              </div>

              {/* Hints */}
              {settings.outputFormat === "png" ? (
                <Tip>PNG is lossless — exact size targeting isn't possible. Switch to JPEG, WebP, or AVIF for best results.</Tip>
              ) : settings.mode === "lossless" ? (
                <Tip>Target size overrides the quality slider. It does not affect lossless mode — switch to Balanced or Aggressive for size targeting.</Tip>
              ) : (
                <Tip>Quality slider is overridden when target size is active. The engine finds the highest quality that fits your target.</Tip>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* ── Max Dimension ── */}
      <Section title="Max Dimension (px)">
        <div className="flex gap-2 flex-wrap">
          {[0, 1280, 1920, 2560, 3840].map((v) => (
            <button
              key={v}
              onClick={() => onChange({ maxWidthOrHeight: v })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                settings.maxWidthOrHeight === v
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                  : "border-border/40 bg-card/20 text-muted hover:bg-card/40"
              }`}
            >
              {v === 0 ? "No Limit" : v === 1280 ? "1280 HD" : v === 1920 ? "1920 FHD" : v === 2560 ? "2560 QHD" : "3840 4K"}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Preserve EXIF ── */}
      <Section title="Metadata">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => onChange({ preserveExif: !settings.preserveExif })}
            className={`relative h-5 w-9 rounded-full border transition-colors cursor-pointer ${
              settings.preserveExif
                ? "bg-blue-500 border-blue-500"
                : "bg-card border-border/50"
            }`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                settings.preserveExif ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <div>
            <span className="text-sm text-foreground">Preserve EXIF metadata</span>
            <p className="text-[11px] text-muted">Camera info, GPS, date — off strips it for privacy & smaller size</p>
          </div>
        </label>
      </Section>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
        {title}
      </label>
      {children}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
      <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
      <p className="text-[11px] text-blue-300/80">{children}</p>
    </div>
  );
}
