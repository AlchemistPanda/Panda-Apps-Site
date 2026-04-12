"use client";

import { X } from "lucide-react";
import { POSTER_TEMPLATES } from "../lib/templates";
import type { PosterTemplate } from "../lib/types";

interface Props {
  onSelect: (template: PosterTemplate) => void;
  onClose: () => void;
}

export default function TemplateSelector({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <h2 className="text-base font-bold">Choose a Template</h2>
            <p className="text-xs text-muted mt-0.5">Pick a starting point for your poster</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-card/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
          {POSTER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => { onSelect(template); onClose(); }}
              className="group relative rounded-xl border border-border/40 bg-background/50 hover:border-fuchsia-500/50 hover:bg-card/80 transition-all p-4 text-left"
            >
              {/* Gradient swatch */}
              <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center text-3xl mb-3 group-hover:scale-105 transition-transform`}>
                {template.emoji}
              </div>
              <div className="text-sm font-semibold leading-tight">{template.name}</div>
              <div className="text-[11px] text-muted mt-0.5 capitalize">{template.category}</div>
              <div className="text-[10px] text-muted/60 mt-1">
                {template.canvasSize.width}×{template.canvasSize.height}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
