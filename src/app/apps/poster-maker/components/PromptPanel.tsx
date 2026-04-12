"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Wand2, LayoutTemplate, ChevronDown } from "lucide-react";
import { enhancePrompt } from "../lib/prompt-enhancer";
import { CANVAS_PRESETS } from "../lib/types";
import type { CanvasPresetId, CanvasSize } from "../lib/types";

interface Props {
  canvasSize: CanvasSize;
  onCanvasSizeChange: (size: CanvasSize, presetId: CanvasPresetId) => void;
  onGenerate: (imageUrl: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  onOpenTemplates: () => void;
}

export default function PromptPanel({
  canvasSize,
  onCanvasSizeChange,
  onGenerate,
  isGenerating,
  setIsGenerating,
  onOpenTemplates,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [enhanced, setEnhanced] = useState("");
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<CanvasPresetId>("instagram-post");
  const [error, setError] = useState("");
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);

  const handleEnhance = () => {
    const e = enhancePrompt(prompt);
    setEnhanced(e);
    setShowEnhanced(true);
  };

  const handleGenerate = async () => {
    const finalPrompt = showEnhanced && enhanced ? enhanced : enhancePrompt(prompt);
    if (!finalPrompt.trim()) { setError("Please enter a description first."); return; }
    setError("");
    setIsGenerating(true);
    try {
      const res = await fetch("/api/poster-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          width: canvasSize.width,
          height: canvasSize.height,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const { imageUrl } = await res.json();
      onGenerate(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePresetChange = (id: CanvasPresetId) => {
    setSelectedPreset(id);
    if (id === "custom") {
      onCanvasSizeChange({ width: customW, height: customH }, id);
    } else {
      const preset = CANVAS_PRESETS.find((p) => p.id === id);
      if (preset) onCanvasSizeChange(preset.size, id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Template picker shortcut */}
      <button
        onClick={onOpenTemplates}
        className="w-full flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/30 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 px-4 py-3 transition-all group"
      >
        <LayoutTemplate className="h-5 w-5 text-muted group-hover:text-fuchsia-400 transition-colors" />
        <div className="text-left">
          <div className="text-sm font-semibold group-hover:text-fuchsia-300 transition-colors">Start with a Template</div>
          <div className="text-xs text-muted">6 ready-made poster layouts</div>
        </div>
        <ChevronDown className="h-4 w-4 text-muted ml-auto rotate-[-90deg] group-hover:text-fuchsia-400 transition-colors" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs text-muted">or describe your poster</span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Canvas Size */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Poster Size
        </label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value as CanvasPresetId)}
          className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 transition-all"
        >
          {CANVAS_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        {selectedPreset === "custom" && (
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              min={100}
              max={4000}
              value={customW}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCustomW(v);
                onCanvasSizeChange({ width: v, height: customH }, "custom");
              }}
              className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500/60 transition-all"
              placeholder="Width"
            />
            <input
              type="number"
              min={100}
              max={4000}
              value={customH}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCustomH(v);
                onCanvasSizeChange({ width: customW, height: v }, "custom");
              }}
              className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500/60 transition-all"
              placeholder="Height"
            />
          </div>
        )}
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Poster Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. sunset beach party invitation with tropical vibes..."
          className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-sm placeholder:text-muted/50 focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 transition-all resize-none"
        />
      </div>

      {/* Enhance toggle */}
      <div>
        <button
          onClick={handleEnhance}
          disabled={!prompt.trim()}
          className="flex items-center gap-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 disabled:text-muted disabled:cursor-not-allowed transition-colors"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Enhance prompt with AI quality tokens
        </button>

        {showEnhanced && enhanced && (
          <div className="mt-2 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400 mb-1.5">
              Enhanced Prompt
            </div>
            <textarea
              value={enhanced}
              onChange={(e) => setEnhanced(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-xs text-muted resize-none focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Generate Button */}
      <button
        onClick={() => handleGenerate()}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-all"
      >
        {isGenerating ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Background
          </>
        )}
      </button>

      {/* Regenerate */}
      {!isGenerating && prompt.trim() && (
        <button
          onClick={() => handleGenerate()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/30 hover:bg-card/60 px-4 py-2.5 text-sm text-muted hover:text-foreground transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate (new variation)
        </button>
      )}

      {/* Info */}
      <div className="rounded-xl border border-border/30 bg-background/30 px-3 py-2.5">
        <p className="text-[11px] text-muted leading-relaxed">
          <span className="text-fuchsia-400 font-semibold">Tip:</span> The AI generates backgrounds without text so you can add your own styled text on top. Powered by{" "}
          <span className="text-foreground font-medium">Google Gemini 2.0 Flash</span> — free tier with 15 images/minute.
        </p>
      </div>
    </div>
  );
}
