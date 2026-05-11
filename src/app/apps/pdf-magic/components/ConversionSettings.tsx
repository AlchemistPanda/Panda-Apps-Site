"use client";

import type { ConversionSettings, I18nStrings } from "../lib/types";
import { FONT_OPTIONS } from "../lib/types";
import { Settings, Type, AlignVerticalSpaceAround, Ruler, FileText, Table, List, Heading } from "lucide-react";

interface ConversionSettingsProps {
  settings: ConversionSettings;
  onChange: (settings: ConversionSettings) => void;
  t: I18nStrings;
}

export default function ConversionSettingsPanel({ settings, onChange, t }: ConversionSettingsProps) {
  const update = <K extends keyof ConversionSettings>(key: K, value: ConversionSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/30 bg-card/50">
        <Settings className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold">{t.settings}</h3>
      </div>

      <div className="p-5 space-y-5">
        {/* Font Family */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
            <Type className="h-3.5 w-3.5" /> {t.font}
          </label>
          <select
            value={settings.fontFamily}
            onChange={(e) => update("fontFamily", e.target.value)}
            className="w-full rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:border-accent/40"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
            <Type className="h-3.5 w-3.5" /> {t.fontSize}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="8" max="18" step="0.5"
              value={settings.fontSize}
              onChange={(e) => update("fontSize", parseFloat(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-sm font-mono w-10 text-right">{settings.fontSize}pt</span>
          </div>
        </div>

        {/* Heading Font */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
            <Heading className="h-3.5 w-3.5" /> {t.headingFont}
          </label>
          <select
            value={settings.headingFont}
            onChange={(e) => update("headingFont", e.target.value)}
            className="w-full rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:border-accent/40"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Line Spacing */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
            <AlignVerticalSpaceAround className="h-3.5 w-3.5" /> {t.lineSpacing}
          </label>
          <select
            value={settings.lineSpacing}
            onChange={(e) => update("lineSpacing", parseFloat(e.target.value))}
            className="w-full rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:border-accent/40"
          >
            <option value={1}>1.0</option>
            <option value={1.15}>1.15</option>
            <option value={1.5}>1.5</option>
            <option value={2}>2.0</option>
          </select>
        </div>

        {/* Margins */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
            <Ruler className="h-3.5 w-3.5" /> {t.margins}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["marginTop", "marginBottom", "marginLeft", "marginRight"] as const).map((key, i) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted/70 w-12">
                  {[t.top, t.bottom, t.left, t.right][i]}
                </span>
                <input
                  type="number" min="0.3" max="2" step="0.1"
                  value={settings[key]}
                  onChange={(e) => update(key, parseFloat(e.target.value) || 1)}
                  className="flex-1 rounded-lg border border-border/40 bg-background/60 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-accent/40"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Page Size */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
            <FileText className="h-3.5 w-3.5" /> {t.pageSize}
          </label>
          <div className="flex gap-2">
            {(["a4", "letter"] as const).map((size) => (
              <button
                key={size}
                onClick={() => update("pageSize", size)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  settings.pageSize === size
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border/40 bg-background/40 hover:border-border/60"
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Detection toggles */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          {([
            { key: "detectHeadings" as const, icon: Heading, label: t.detectHeadings },
            { key: "detectTables" as const, icon: Table, label: t.detectTables },
            { key: "detectLists" as const, icon: List, label: t.detectLists },
          ]).map(({ key, icon: Icon, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div className={`
                h-5 w-5 rounded-md border flex items-center justify-center transition-all
                ${settings[key]
                  ? "bg-accent border-accent text-black"
                  : "border-border/60 bg-background/40 group-hover:border-border"}
              `}>
                {settings[key] && <span className="text-xs font-bold">✓</span>}
              </div>
              <Icon className="h-3.5 w-3.5 text-muted" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
