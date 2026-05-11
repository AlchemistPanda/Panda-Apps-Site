"use client";

import { useState } from "react";
import { 
  ArrowLeft, Globe, Sparkles, FileText, 
  Layers, Settings, Wand2, Minimize2, Trash2
} from "lucide-react";
import Link from "next/link";
import { translations } from "../data/i18n";
import { type PdfTool, type ConversionSettings, DEFAULT_SETTINGS } from "../lib/types";
import ToolConvert from "./ToolConvert";
import ToolMerge from "./ToolMerge";
import ToolOrganize from "./ToolOrganize";
import ToolCompress from "./ToolCompress";
import ToolEdit from "./ToolEdit";
import ConversionSettingsPanel from "./ConversionSettings";

export default function PdfMagicClient() {
  const [lang, setLang] = useState<"en" | "ml">("en");
  const t = translations[lang];

  const [activeTool, setActiveTool] = useState<PdfTool>("convert");
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const tools = [
    { id: "convert", label: t.toolConvert, icon: FileText },
    { id: "merge", label: t.toolMerge, icon: Layers },
    { id: "organize", label: t.toolOrganize, icon: Trash2 },
    { id: "compress", label: t.toolCompress, icon: Minimize2 },
    { id: "edit", label: t.toolEdit, icon: Wand2 },
  ] as const;

  return (
    <div className="min-h-screen relative">
      <div className="gradient-bg" />
      <div className="grid-pattern" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Apps
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
              </div>
              <p className="text-muted text-sm sm:text-base max-w-xl">{t.subtitle}</p>
            </div>

            <button
              onClick={() => setLang(lang === "en" ? "ml" : "en")}
              className="flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-3.5 py-2 text-xs font-medium hover:border-accent/30 transition-all"
            >
              <Globe className="h-3.5 w-3.5 text-accent" />
              {lang === "en" ? "മലയാളം" : "English"}
            </button>
          </div>
        </div>

        {/* Tool Navigation */}
        <div className="flex items-center gap-1 mb-8 p-1 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-x-auto scrollbar-hide">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as PdfTool)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0
                ${activeTool === tool.id 
                  ? "bg-accent text-black shadow-lg shadow-accent/20" 
                  : "text-muted hover:text-foreground hover:bg-card/50"}
              `}
            >
              <tool.icon className="h-4 w-4" />
              {tool.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Tool Area */}
          <div className="lg:col-span-2">
            {activeTool === "convert" && <ToolConvert t={t} settings={settings} />}
            {activeTool === "merge" && <ToolMerge t={t} />}
            {activeTool === "organize" && <ToolOrganize t={t} />}
            {activeTool === "compress" && <ToolCompress t={t} />}
            {activeTool === "edit" && <ToolEdit t={t} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {activeTool === "convert" && (
              <>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="lg:hidden w-full flex items-center justify-between rounded-xl border border-border/40 bg-card/30 px-4 py-3 text-sm font-medium"
                >
                  <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> {t.settings}</span>
                  <span className="text-muted">{showSettings ? "▲" : "▼"}</span>
                </button>
                <div className={`${showSettings ? "block" : "hidden"} lg:block`}>
                  <ConversionSettingsPanel settings={settings} onChange={setSettings} t={t} />
                </div>
              </>
            )}

            {/* Privacy Card */}
            <div className="rounded-2xl border border-border/40 bg-card/30 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> 
                100% Private
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                Most operations happen locally in your browser using <strong>pdf-lib</strong>. 
                Your files are never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
