"use client";

import { useState } from "react";
import { Download, FileImage } from "lucide-react";
import { saveAs } from "file-saver";

interface Props {
  onExport: (format: "png" | "jpeg", quality: number, multiplier: number) => string;
}

export default function ExportPanel({ onExport }: Props) {
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(0.92);
  const [multiplier, setMultiplier] = useState(2);
  const [filename, setFilename] = useState("my-poster");
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dataUrl = onExport(format, quality, multiplier);
      const blob = await (await fetch(dataUrl)).blob();
      saveAs(blob, `${filename || "poster"}.${format === "jpeg" ? "jpg" : "png"}`);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-border/30">
        <FileImage className="h-4 w-4 text-fuchsia-400" />
        <span className="text-sm font-semibold">Export Settings</span>
      </div>

      {/* Format */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Format</label>
        <div className="grid grid-cols-2 gap-2">
          {(["png", "jpeg"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                format === f
                  ? "border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-300"
                  : "border-border/40 bg-card/20 text-muted hover:text-foreground"
              }`}
            >
              {f.toUpperCase()}
              <div className="text-[10px] font-normal mt-0.5 text-muted">
                {f === "png" ? "Lossless" : "Smaller file"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quality (JPEG only) */}
      {format === "jpeg" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Quality</label>
            <span className="text-xs font-mono">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-fuchsia-500"
          />
        </div>
      )}

      {/* Scale multiplier */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Resolution Scale</label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((m) => (
            <button
              key={m}
              onClick={() => setMultiplier(m)}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                multiplier === m
                  ? "border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-300"
                  : "border-border/40 bg-card/20 text-muted hover:text-foreground"
              }`}
            >
              {m}×
              <div className="text-[10px] font-normal mt-0.5 text-muted">
                {m === 1 ? "Screen" : m === 2 ? "HD" : "4K"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filename */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Filename</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="flex-1 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500/60 transition-all"
          />
          <span className="text-sm text-muted">.{format === "jpeg" ? "jpg" : "png"}</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-all"
      >
        {isExporting ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download Poster
          </>
        )}
      </button>

      <div className="rounded-xl border border-border/30 bg-background/30 px-3 py-2.5">
        <p className="text-[11px] text-muted leading-relaxed">
          <span className="text-fuchsia-400 font-semibold">Note:</span> The poster is exported at full resolution regardless of the preview size shown on screen.
        </p>
      </div>
    </div>
  );
}
