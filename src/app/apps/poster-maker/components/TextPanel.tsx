"use client";

import { useState } from "react";
import {
  Type,
  Trash2,
  BringToFront,
  SendToBack,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
} from "lucide-react";
import MalayalamInput from "./MalayalamInput";
import type { ActiveObjectProps } from "./CanvasEditor";

const FONT_FAMILIES = [
  { label: "Poppins", value: "Poppins" },
  { label: "Inter", value: "Inter" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Roboto", value: "Roboto" },
  { label: "Noto Sans Malayalam", value: "Noto Sans Malayalam" },
  { label: "Manjari (Malayalam)", value: "Manjari" },
  { label: "Gayathri (Malayalam)", value: "Gayathri" },
  { label: "Chilanka (Malayalam)", value: "Chilanka" },
];

const COLOR_SWATCHES = [
  "#ffffff", "#000000", "#f59e0b", "#ef4444", "#22c55e",
  "#3b82f6", "#a855f7", "#ec4899", "#f97316", "#14b8a6",
];

interface Props {
  selectedObject: ActiveObjectProps | null;
  onAddText: () => void;
  onUpdateText: (props: { text?: string; fontFamily?: string; fontSize?: number; fill?: string; fontWeight?: string; fontStyle?: string; textAlign?: string }) => void;
  onUpdateOpacity: (opacity: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
}

export default function TextPanel({
  selectedObject,
  onAddText,
  onUpdateText,
  onUpdateOpacity,
  onBringForward,
  onSendBackward,
  onDelete,
}: Props) {
  const [showMalayalam, setShowMalayalam] = useState(false);

  const isText = selectedObject?.type === "text";

  const handleMalayalamInsert = (text: string) => {
    if (!selectedObject || !isText) return;
    const current = selectedObject.text || "";
    onUpdateText({ text: current + text });
  };

  return (
    <div className="space-y-5">
      {/* Add text button */}
      <button
        onClick={onAddText}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 hover:border-fuchsia-500/50 bg-background/20 hover:bg-fuchsia-500/5 px-4 py-3 text-sm font-semibold text-muted hover:text-fuchsia-300 transition-all"
      >
        <Plus className="h-4 w-4" />
        Add Text Layer
      </button>

      {!selectedObject && (
        <div className="rounded-xl border border-border/30 bg-background/30 px-4 py-6 text-center">
          <Type className="h-8 w-8 text-muted/40 mx-auto mb-2" />
          <p className="text-sm text-muted">Click &quot;Add Text Layer&quot; then click on the text in the canvas to select and edit it.</p>
        </div>
      )}

      {selectedObject && (
        <>
          {/* Text content (only for text objects) */}
          {isText && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Text Content</label>
              <textarea
                value={selectedObject.text || ""}
                onChange={(e) => onUpdateText({ text: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 transition-all resize-none"
              />

              {/* Malayalam toggle */}
              <div className="mt-2">
                <button
                  onClick={() => setShowMalayalam(!showMalayalam)}
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                    showMalayalam
                      ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                      : "border-border/40 text-muted hover:text-foreground"
                  }`}
                >
                  🔠 Manglish → Malayalam
                </button>

                {showMalayalam && (
                  <div className="mt-3">
                    <MalayalamInput onInsert={handleMalayalamInsert} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Font Family (text only) */}
          {isText && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Font Family</label>
              <select
                value={selectedObject.fontFamily || "Poppins"}
                onChange={(e) => onUpdateText({ fontFamily: e.target.value })}
                className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500/60 transition-all"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Font Size */}
          {isText && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Font Size</label>
                <span className="text-xs font-mono text-foreground">{selectedObject.fontSize ?? 60}px</span>
              </div>
              <input
                type="range"
                min={8}
                max={300}
                value={selectedObject.fontSize ?? 60}
                onChange={(e) => onUpdateText({ fontSize: Number(e.target.value) })}
                className="w-full accent-fuchsia-500"
              />
            </div>
          )}

          {/* Text Style (text only) */}
          {isText && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateText({ fontWeight: selectedObject.fontWeight === "bold" ? "normal" : "bold" })}
                  className={`flex items-center justify-center rounded-lg border px-3 py-2 transition-all ${
                    selectedObject.fontWeight === "bold"
                      ? "border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-300"
                      : "border-border/50 text-muted hover:text-foreground"
                  }`}
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onUpdateText({ fontStyle: selectedObject.fontStyle === "italic" ? "normal" : "italic" })}
                  className={`flex items-center justify-center rounded-lg border px-3 py-2 transition-all ${
                    selectedObject.fontStyle === "italic"
                      ? "border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-300"
                      : "border-border/50 text-muted hover:text-foreground"
                  }`}
                >
                  <Italic className="h-4 w-4" />
                </button>
                <div className="flex-1 flex gap-1">
                  {(["left", "center", "right"] as const).map((align) => {
                    const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                    return (
                      <button
                        key={align}
                        onClick={() => onUpdateText({ textAlign: align })}
                        className={`flex-1 flex items-center justify-center rounded-lg border py-2 transition-all ${
                          selectedObject.textAlign === align
                            ? "border-fuchsia-500/60 bg-fuchsia-500/20 text-fuchsia-300"
                            : "border-border/50 text-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {isText ? "Text Color" : "Fill Color"}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateText({ fill: color })}
                  className={`h-7 w-7 rounded-lg border-2 transition-all ${
                    selectedObject.fill === color ? "border-fuchsia-400 scale-110" : "border-border/40 hover:border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedObject.fill || "#ffffff"}
                onChange={(e) => onUpdateText({ fill: e.target.value })}
                className="h-8 w-12 rounded-lg border border-border/50 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={selectedObject.fill || "#ffffff"}
                onChange={(e) => onUpdateText({ fill: e.target.value })}
                className="flex-1 rounded-xl border border-border/50 bg-card/40 px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-fuchsia-500/60 transition-all"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Opacity</label>
              <span className="text-xs font-mono text-foreground">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={selectedObject.opacity ?? 1}
              onChange={(e) => onUpdateOpacity(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
          </div>

          {/* Layer & Delete actions */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
            <button
              onClick={onBringForward}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 py-2.5 text-[11px] text-muted hover:text-foreground transition-all"
            >
              <BringToFront className="h-4 w-4" />
              Forward
            </button>
            <button
              onClick={onSendBackward}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-card/30 hover:bg-card/60 py-2.5 text-[11px] text-muted hover:text-foreground transition-all"
            >
              <SendToBack className="h-4 w-4" />
              Backward
            </button>
            <button
              onClick={onDelete}
              className="flex flex-col items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 py-2.5 text-[11px] text-red-400 hover:text-red-300 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
