"use client";

import { useState, useRef, useCallback } from "react";
import { Palette, ImageIcon, Sliders, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { PaletteColor, HarmonyType, TabId } from "../types";
import { PRESET_PALETTES, HARMONY_OPTIONS, hexToColor } from "../types";
import { extractColorsFromImageData, generateHarmony } from "../palette";
import ColorCard from "./ColorCard";
import UploadZone from "./UploadZone";
import ExportPanel from "./ExportPanel";

/* ── Types ─────────────────────────────────────────────────────── */
interface ActivePalette {
  name: string;
  colors: PaletteColor[];
}

/* ── Helpers ────────────────────────────────────────────────────── */
const EXTRACT_COUNT = 8;

function loadImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Scale down for performance
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(ctx.getImageData(0, 0, w, h));
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ── Component ──────────────────────────────────────────────────── */
export default function ColorPaletteClient() {
  const [tab, setTab] = useState<TabId>("presets");

  // Extract tab
  const [extractedColors, setExtractedColors] = useState<PaletteColor[]>([]);
  const [extractName, setExtractName]         = useState("My Palette");
  const [imagePreview, setImagePreview]       = useState<string | null>(null);
  const [isProcessing, setIsProcessing]       = useState(false);
  const [extractCount, setExtractCount]       = useState(EXTRACT_COUNT);

  // Harmony tab
  const [baseColor, setBaseColor]     = useState("#7c3aed");
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("analogous");
  const harmonyColors = generateHarmony(baseColor, harmonyType);

  // Presets tab
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Which palette is shown in the export panel
  const activePalette: ActivePalette | null =
    tab === "extract" && extractedColors.length > 0
      ? { name: extractName, colors: extractedColors }
      : tab === "harmony"
      ? { name: `${harmonyType} ${baseColor}`, colors: harmonyColors }
      : tab === "presets" && selectedPreset !== null
      ? { name: PRESET_PALETTES[selectedPreset].name, colors: PRESET_PALETTES[selectedPreset].colors.map(hexToColor) }
      : null;

  /* ── Image extraction ─────────────────────────────────────────── */
  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setExtractName(file.name.replace(/\.[^.]+$/, ""));
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    try {
      const imgData = await loadImageData(file);
      const colors  = extractColorsFromImageData(imgData.data, extractCount, 4);
      setExtractedColors(colors);
    } finally {
      setIsProcessing(false);
    }
  }, [extractCount]);

  /* ── Tabs ─────────────────────────────────────────────────────── */
  const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "presets",  label: "Curated Presets",  icon: Sparkles  },
    { id: "extract",  label: "Extract from Image", icon: ImageIcon },
    { id: "harmony",  label: "Color Harmony",    icon: Sliders   },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Link href="/#apps" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />Back
          </Link>
          <span className="text-border/60">|</span>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Palette className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">Color Palette</span>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/10 border border-pink-500/20 px-4 py-1.5 text-xs font-medium text-pink-400">
            <Palette className="h-3 w-3" />
            Color Palette Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Beautiful colors,{" "}
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
              instantly
            </span>
          </h1>
          <p className="text-muted max-w-xl mx-auto text-sm">
            Extract palettes from images, generate color harmonies, or explore curated collections — then export in any format you need.
          </p>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1 rounded-2xl border border-border/30 bg-card/30 p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                tab === id
                  ? "bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 text-pink-300"
                  : "text-muted hover:text-foreground hover:bg-card/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB: PRESETS
        ══════════════════════════════════════════════════════════ */}
        {tab === "presets" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_PALETTES.map((preset, i) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedPreset(i)}
                  className={`group rounded-2xl border p-0 overflow-hidden text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    selectedPreset === i
                      ? "border-pink-500/40 ring-2 ring-pink-500/20"
                      : "border-border/30 hover:border-pink-500/30"
                  }`}
                >
                  {/* Swatch strip */}
                  <div className="flex h-14">
                    {preset.colors.map((hex) => (
                      <div
                        key={hex}
                        className="flex-1"
                        style={{ background: hex }}
                      />
                    ))}
                  </div>
                  {/* Info */}
                  <div className="bg-card/50 px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{preset.name}</p>
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {preset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-card/60 border border-border/30 px-2 py-0.5 text-[10px] text-muted capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected preset detail */}
            {selectedPreset !== null && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-lg font-bold text-foreground">
                  {PRESET_PALETTES[selectedPreset].name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {PRESET_PALETTES[selectedPreset].colors.map((hex) => (
                    <ColorCard key={hex} color={hexToColor(hex)} size="md" />
                  ))}
                </div>
                <ExportPanel
                  colors={PRESET_PALETTES[selectedPreset].colors.map(hexToColor)}
                  paletteName={PRESET_PALETTES[selectedPreset].name}
                />
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: EXTRACT
        ══════════════════════════════════════════════════════════ */}
        {tab === "extract" && (
          <div className="space-y-6">
            {/* Count selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">Colors to extract:</span>
              {[4, 6, 8, 10, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setExtractCount(n)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    extractCount === n
                      ? "border-pink-500/40 bg-pink-500/10 text-pink-300"
                      : "border-border/40 bg-card/20 text-muted hover:bg-card/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <UploadZone onFile={handleFile} isProcessing={isProcessing} />

            {/* Results */}
            {imagePreview && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image preview */}
                <div className="lg:col-span-1">
                  <div className="rounded-2xl overflow-hidden border border-border/30">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1">
                      Palette name
                    </label>
                    <input
                      value={extractName}
                      onChange={(e) => setExtractName(e.target.value)}
                      className="w-full rounded-xl border border-border/40 bg-card/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="lg:col-span-2 space-y-4">
                  {extractedColors.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {extractedColors.map((c, i) => (
                          <ColorCard key={i} color={c} size="md" />
                        ))}
                      </div>
                      <ExportPanel colors={extractedColors} paletteName={extractName} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted text-sm">
                      Processing…
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: HARMONY
        ══════════════════════════════════════════════════════════ */}
        {tab === "harmony" && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-end gap-6">
              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                  Base Color
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden border-2 border-border/40">
                    <input
                      type="color"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="h-full w-full" style={{ background: baseColor }} />
                  </div>
                  <input
                    type="text"
                    value={baseColor}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-f]{6}$/i.test(v)) setBaseColor(v);
                      else if (/^#[0-9a-f]{0,6}$/i.test(v)) setBaseColor(v);
                    }}
                    className="w-28 rounded-xl border border-border/40 bg-card/30 px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-pink-500/50"
                    maxLength={7}
                    placeholder="#7c3aed"
                  />
                </div>
              </div>

              {/* Quick hue presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                  Quick Colors
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "#ef4444", "#f97316", "#eab308", "#22c55e",
                    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
                  ].map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setBaseColor(hex)}
                      className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${
                        baseColor === hex ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ background: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Harmony type selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                Harmony Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HARMONY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHarmonyType(opt.value)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      harmonyType === opt.value
                        ? "border-pink-500/40 bg-pink-500/8"
                        : "border-border/40 bg-card/20 hover:bg-card/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-sm font-semibold ${harmonyType === opt.value ? "text-pink-300" : "text-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-muted">{opt.count} colors</span>
                    </div>
                    <p className="text-[11px] text-muted">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated palette */}
            <div className="space-y-4">
              <div className={`grid gap-3 ${
                harmonyColors.length === 2 ? "grid-cols-2" :
                harmonyColors.length === 3 ? "grid-cols-3" :
                harmonyColors.length === 4 ? "grid-cols-2 sm:grid-cols-4" :
                "grid-cols-2 sm:grid-cols-5"
              }`}>
                {harmonyColors.map((c, i) => (
                  <ColorCard key={i} color={c} size="lg" />
                ))}
              </div>
              <ExportPanel
                colors={harmonyColors}
                paletteName={`${harmonyType}-${baseColor.replace("#", "")}`}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
