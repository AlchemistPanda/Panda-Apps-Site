"use client";

import { useState, useRef, useCallback } from "react";
import {
  Sparkles,
  Type,
  Layers,
  Download,
  ArrowLeft,
  ImagePlus,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import CanvasEditor, { type CanvasEditorHandle, type ActiveObjectProps } from "./CanvasEditor";
import PromptPanel from "./PromptPanel";
import TextPanel from "./TextPanel";
import ElementsPanel from "./ElementsPanel";
import ExportPanel from "./ExportPanel";
import TemplateSelector from "./TemplateSelector";
import type { ActiveTab, CanvasSize, CanvasPresetId, PosterTemplate } from "../lib/types";
import { CANVAS_PRESETS } from "../lib/types";

const tabs: { id: ActiveTab; label: string; icon: typeof Sparkles }[] = [
  { id: "prompt", label: "Prompt", icon: Sparkles },
  { id: "text", label: "Text", icon: Type },
  { id: "elements", label: "Elements", icon: Layers },
  { id: "export", label: "Export", icon: Download },
];

export default function PosterMakerClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("prompt");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedObject, setSelectedObject] = useState<ActiveObjectProps | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(
    CANVAS_PRESETS.find((p) => p.id === "instagram-post")!.size
  );
  const [canvasKey, setCanvasKey] = useState(0);

  const canvasRef = useRef<CanvasEditorHandle>(null);

  const handleSelectionChange = useCallback((props: ActiveObjectProps | null) => {
    setSelectedObject(props);
    // Auto-switch to text tab when text is selected
    if (props?.type === "text") setActiveTab("text");
    else if (props?.type === "image" || props?.type === "shape") setActiveTab("elements");
  }, []);

  const handleGenerate = useCallback(async (url: string) => {
    await canvasRef.current?.setBackground(url);
  }, []);

  const handleCanvasSizeChange = useCallback((size: CanvasSize, _presetId: CanvasPresetId) => {
    setCanvasSize(size);
    // Re-mount canvas with new size
    setCanvasKey((k) => k + 1);
  }, []);

  const handleTemplateSelect = useCallback(async (template: PosterTemplate) => {
    setCanvasSize(template.canvasSize);
    setCanvasKey((k) => k + 1);
    // Small delay to allow canvas re-mount
    setTimeout(async () => {
      await canvasRef.current?.loadTemplate(template);
    }, 100);
  }, []);

  const handleUpdateText = useCallback((props: { text?: string; fontFamily?: string; fontSize?: number; fill?: string; fontWeight?: string; fontStyle?: string; textAlign?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasRef.current?.updateSelectedText(props as any);
    setSelectedObject((prev) => prev ? { ...prev, ...props } : prev);
  }, []);

  const handleUpdateOpacity = useCallback((opacity: number) => {
    canvasRef.current?.updateSelectedOpacity(opacity);
    setSelectedObject((prev) => prev ? { ...prev, opacity } : prev);
  }, []);

  const handleExport = useCallback((format: "png" | "jpeg", quality: number, multiplier: number) => {
    return canvasRef.current?.exportCanvas(format, quality, multiplier) ?? "";
  }, []);

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Apps
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/20">
              <ImagePlus className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">AI Poster Maker</h1>
                <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Free
                </span>
                <span className="rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">
                  Malayalam
                </span>
              </div>
              <p className="text-sm text-muted mt-0.5">
                Generate AI backgrounds · Add editable text · Malayalam/Manglish support
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-border/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === tab.id
                        ? "text-fuchsia-400 border-b-2 border-fuchsia-400 bg-fuchsia-500/5"
                        : "text-muted hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-5 max-h-[calc(100vh-260px)] overflow-y-auto">
                {activeTab === "prompt" && (
                  <PromptPanel
                    canvasSize={canvasSize}
                    onCanvasSizeChange={handleCanvasSizeChange}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    onOpenTemplates={() => setShowTemplates(true)}
                  />
                )}
                {activeTab === "text" && (
                  <TextPanel
                    selectedObject={selectedObject?.type === "text" ? selectedObject : null}
                    onAddText={() => canvasRef.current?.addText()}
                    onUpdateText={handleUpdateText}
                    onUpdateOpacity={handleUpdateOpacity}
                    onBringForward={() => canvasRef.current?.bringForward()}
                    onSendBackward={() => canvasRef.current?.sendBackward()}
                    onDelete={() => { canvasRef.current?.deleteSelected(); setSelectedObject(null); }}
                  />
                )}
                {activeTab === "elements" && (
                  <ElementsPanel
                    selectedObject={selectedObject}
                    onAddImage={(blob) => canvasRef.current?.addImage(blob)}
                    onAddShape={(type) => canvasRef.current?.addShape(type)}
                    onUpdateOpacity={handleUpdateOpacity}
                    onBringForward={() => canvasRef.current?.bringForward()}
                    onSendBackward={() => canvasRef.current?.sendBackward()}
                    onDelete={() => { canvasRef.current?.deleteSelected(); setSelectedObject(null); }}
                  />
                )}
                {activeTab === "export" && (
                  <ExportPanel onExport={handleExport} />
                )}
              </div>
            </div>
          </div>

          {/* Right: Canvas Preview */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-6">
                {/* Preview header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-fuchsia-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
                      Canvas Preview
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted">
                    <span className="rounded-full bg-background/50 border border-border/40 px-2 py-0.5">
                      {canvasSize.width} × {canvasSize.height}
                    </span>
                    {isGenerating && (
                      <span className="flex items-center gap-1 text-fuchsia-400">
                        <div className="h-2 w-2 rounded-full bg-fuchsia-400 animate-pulse" />
                        Generating...
                      </span>
                    )}
                  </div>
                </div>

                {/* Canvas */}
                <div className="relative flex items-center justify-center min-h-64 sm:min-h-80">
                  <CanvasEditor
                    key={canvasKey}
                    ref={canvasRef}
                    canvasSize={canvasSize}
                    onSelectionChange={handleSelectionChange}
                  />

                  {/* Generating overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="h-10 w-10 rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin mx-auto mb-3" />
                        <div className="text-sm font-semibold text-white">Generating your poster...</div>
                        <div className="text-xs text-white/60 mt-1">This may take a few seconds</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Canvas hints */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Click object to select",
                    "Drag to move",
                    "Drag corners to resize",
                    "Double-click text to edit",
                  ].map((hint) => (
                    <span
                      key={hint}
                      className="rounded-full bg-background/50 border border-border/30 px-2.5 py-1 text-[10px] text-muted"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => { canvasRef.current?.addText(); setActiveTab("text"); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-card/20 hover:bg-card/50 px-4 py-3 text-sm text-muted hover:text-foreground transition-all"
                >
                  <Type className="h-4 w-4" />
                  Add Text
                </button>
                <button
                  onClick={() => setActiveTab("export")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 hover:bg-fuchsia-500/15 px-4 py-3 text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Export Poster
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
