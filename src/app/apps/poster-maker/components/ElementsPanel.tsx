"use client";

import { useRef } from "react";
import { Upload, Square, Circle, Minus, Trash2, BringToFront, SendToBack } from "lucide-react";
import type { ActiveObjectProps } from "./CanvasEditor";

interface Props {
  selectedObject: ActiveObjectProps | null;
  onAddImage: (blob: Blob) => void;
  onAddShape: (type: "rect" | "circle" | "line") => void;
  onUpdateOpacity: (opacity: number) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDelete: () => void;
}

export default function ElementsPanel({
  selectedObject,
  onAddImage,
  onAddShape,
  onUpdateOpacity,
  onBringForward,
  onSendBackward,
  onDelete,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddImage(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onAddImage(file);
  };

  return (
    <div className="space-y-5">
      {/* Image Upload */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Upload Image</label>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-border/50 hover:border-fuchsia-500/50 bg-background/20 hover:bg-fuchsia-500/5 px-4 py-6 text-center cursor-pointer transition-all group"
        >
          <Upload className="h-7 w-7 text-muted group-hover:text-fuchsia-400 mx-auto mb-2 transition-colors" />
          <div className="text-sm font-semibold text-muted group-hover:text-foreground transition-colors">
            Drop image here
          </div>
          <div className="text-xs text-muted/60 mt-1">or click to browse</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Shapes */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Add Shape</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onAddShape("rect")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-card/30 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 py-3 text-xs text-muted hover:text-foreground transition-all"
          >
            <Square className="h-5 w-5" />
            Rectangle
          </button>
          <button
            onClick={() => onAddShape("circle")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-card/30 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 py-3 text-xs text-muted hover:text-foreground transition-all"
          >
            <Circle className="h-5 w-5" />
            Circle
          </button>
          <button
            onClick={() => onAddShape("line")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border/40 bg-card/30 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 py-3 text-xs text-muted hover:text-foreground transition-all"
          >
            <Minus className="h-5 w-5" />
            Line
          </button>
        </div>
      </div>

      {/* Selected element controls */}
      {selectedObject && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-4">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider">
            Selected: {selectedObject.type}
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted">Opacity</label>
              <span className="text-xs font-mono">{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
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

          {/* Layer & Delete */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onBringForward}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-background/30 hover:bg-card/60 py-2.5 text-[11px] text-muted hover:text-foreground transition-all"
            >
              <BringToFront className="h-4 w-4" />
              Forward
            </button>
            <button
              onClick={onSendBackward}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-background/30 hover:bg-card/60 py-2.5 text-[11px] text-muted hover:text-foreground transition-all"
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
        </div>
      )}

      {!selectedObject && (
        <div className="rounded-xl border border-border/30 bg-background/30 px-4 py-4 text-center">
          <p className="text-xs text-muted">Click an element on the canvas to select and edit it.</p>
        </div>
      )}
    </div>
  );
}
