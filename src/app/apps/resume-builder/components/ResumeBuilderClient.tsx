"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, Download, FileJson, FileText, Eye, Edit3, Palette, LayoutTemplate,
  Sparkles, Trash2, Upload, RotateCcw, Check, FileType,
} from "lucide-react";
import ResumeEditor from "./ResumeEditor";
import { ResumePreview } from "./ResumeTemplates";
import type { ResumeData, TemplateName } from "../data/types";
import { EMPTY_RESUME, SAMPLE_RESUME } from "../data/types";

const ACCENT_COLORS = [
  "#2563eb", "#0891b2", "#059669", "#7c3aed", "#dc2626",
  "#ea580c", "#ca8a04", "#0f172a", "#475569", "#be185d",
];

const TEMPLATES: { id: TemplateName; label: string; desc: string }[] = [
  { id: "modern",   label: "Modern",   desc: "Clean header with accent bar" },
  { id: "classic",  label: "Classic",  desc: "Traditional serif layout" },
  { id: "minimal",  label: "Minimal",  desc: "Ultra-clean, maximum whitespace" },
  { id: "creative", label: "Creative", desc: "Bold colored sidebar" },
];

const STORAGE_KEY = "panda-resume-data";

export default function ResumeBuilderClient() {
  /* ── State ──────────────────────────────────────────────────────────── */
  const [data, setData]           = useState<ResumeData>(EMPTY_RESUME);
  const [view, setView]           = useState<"edit" | "preview">("edit");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDownload, setShowDownload]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const previewRef                = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData({ ...EMPTY_RESUME, ...parsed });
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaving(true);
      setTimeout(() => setSaving(false), 1200);
    }, 800);
    return () => clearTimeout(timeout);
  }, [data, loaded]);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const loadSample = useCallback(() => {
    if (data.personal.fullName && !confirm("This will replace your current data. Continue?")) return;
    setData(SAMPLE_RESUME);
  }, [data.personal.fullName]);

  const clearAll = useCallback(() => {
    if (!confirm("Clear all resume data?")) return;
    setData(EMPTY_RESUME);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${data.personal.fullName || "resume"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type  = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          setData({ ...EMPTY_RESUME, ...parsed });
        } catch { alert("Invalid JSON file"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Use window.print for a cleaner PDF (browser handles pagination)
  const printPDF = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${data.personal.fullName || "Resume"}</title>
      <script src="https://cdn.tailwindcss.com"><\/script>
      <style>
        @page { margin: 0; size: A4; }
        body { margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }, [data.personal.fullName]);

  // Download editable Word (.docx)
  const downloadDocx = useCallback(async () => {
    const { generateDocx } = await import("./exportDocx");
    const blob = await generateDocx(data);
    const { saveAs } = await import("file-saver");
    saveAs(blob, `${data.personal.fullName || "resume"}.docx`);
  }, [data]);

  /* ── Rendering ──────────────────────────────────────────────────────── */
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden">
      {/* ─ Top Nav ─ */}
      <nav className="flex-shrink-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition shrink-0">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="h-5 w-px bg-gray-200 shrink-0" />
          <h1 className="text-sm font-semibold text-gray-900 shrink-0 hidden sm:block">Resume Builder</h1>

          {/* Auto-save indicator */}
          <span className={`shrink-0 flex items-center gap-1 text-[10px] ${saving ? "text-green-500" : "text-gray-400"} transition`}>
            {saving && <><Check className="h-3 w-3" /> Saved</>}
          </span>

          <div className="flex-1 min-w-2" />

          {/* Mobile view toggle */}
          <div className="flex lg:hidden items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
            <button onClick={() => setView("edit")}
              className={`px-2.5 py-1.5 text-xs font-medium transition ${view === "edit" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Edit3 className="h-3.5 w-3.5 inline mr-0.5" />Edit
            </button>
            <button onClick={() => setView("preview")}
              className={`px-2.5 py-1.5 text-xs font-medium transition ${view === "preview" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Eye className="h-3.5 w-3.5 inline mr-0.5" />Preview
            </button>
          </div>

          {/* Template picker toggle */}
          <button onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition shrink-0">
            <LayoutTemplate className="h-3.5 w-3.5" /> Template
          </button>

          {/* Download button */}
          <div className="relative shrink-0">
            <button onClick={() => setShowDownload(!showDownload)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>

          {/* More actions */}
          <div className="hidden sm:flex items-center gap-1 ml-1">
            <button onClick={importJSON} title="Import JSON"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <Upload className="h-4 w-4" />
            </button>
            <button onClick={loadSample} title="Load sample resume"
              className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition">
              <Sparkles className="h-4 w-4" />
            </button>
            <button onClick={clearAll} title="Clear all"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Template picker bar */}
        {showTemplates && (
          <div className="border-t border-gray-100 bg-white px-4 py-3">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs font-semibold text-gray-800">Choose Template</span>
                <div className="flex-1"/>
                <span className="text-xs font-semibold text-gray-800 mr-1">Accent Color</span>
                <div className="flex gap-1.5">
                  {ACCENT_COLORS.map((c) => (
                    <button key={c} onClick={() => setData({ ...data, accentColor: c })}
                      className={`w-5 h-5 rounded-full border-2 transition ${data.accentColor === c ? "border-gray-800 scale-110" : "border-transparent hover:scale-110"}`}
                      style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setData({ ...data, template: t.id })}
                    className={`rounded-xl border-2 p-3 text-left transition hover:shadow-md ${
                      data.template === t.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="text-xs font-semibold text-gray-800">{t.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─ Main content ─ */}
      <div className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto flex gap-6 px-4 py-4">
        {/* Left: Editor */}
        <div className={`w-full lg:w-[420px] xl:w-[460px] shrink-0 overflow-y-auto pb-6 ${view === "preview" ? "hidden lg:block" : ""}`}>
          {/* Quick start */}
          {!data.personal.fullName && (
            <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Quick Start
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-3">Load a sample resume to see how it works, or start from scratch.</p>
              <div className="flex gap-2">
                <button onClick={loadSample}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm">
                  Load Sample Resume
                </button>
                <button onClick={importJSON}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-white transition">
                  Import JSON
                </button>
              </div>
            </div>
          )}

          {/* Mobile actions */}
          <div className="flex sm:hidden items-center gap-1 mb-3">
            <button onClick={loadSample}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Sample
            </button>
            <button onClick={importJSON}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <Upload className="h-3.5 w-3.5" /> Import
            </button>
            <button onClick={clearAll}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border border-gray-200 rounded-lg text-red-500 hover:bg-red-50">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>

          <ResumeEditor data={data} onChange={setData} />
        </div>

        {/* Right: Preview */}
        <div className={`flex-1 min-w-0 overflow-y-auto pb-6 ${view === "edit" ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
              {/* A4 preview container */}
              <div ref={previewRef}
                className="w-full"
                style={{ minHeight: "auto", overflow: "visible" }}>
                <ResumePreview data={data} />
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              A4 preview · Changes auto-saved to browser
            </p>
          </div>
        </div>
      </div>

      {/* Download dropdown overlay - rendered outside nav to avoid clipping */}
      {showDownload && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowDownload(false)} />
          <div className="fixed top-16 right-4 sm:right-auto sm:absolute z-[70] w-64 bg-white rounded-xl border border-gray-200 shadow-xl p-2"
            style={{ right: "1rem" }}>
            <button onClick={() => { printPDF(); setShowDownload(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition">
              <FileText className="h-4 w-4 text-red-500" />
              <div className="text-left"><div className="font-medium">PDF</div><div className="text-[10px] text-gray-400">Download as PDF (via browser print)</div></div>
            </button>
            <button onClick={() => { downloadDocx(); setShowDownload(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 rounded-lg transition">
              <FileType className="h-4 w-4 text-indigo-500" />
              <div className="text-left"><div className="font-medium">Word (.docx)</div><div className="text-[10px] text-gray-400">Editable in MS Word / Google Docs</div></div>
            </button>
            <hr className="my-1 border-gray-100" />
            <button onClick={() => { exportJSON(); setShowDownload(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition">
              <FileJson className="h-4 w-4 text-green-500" />
              <div className="text-left"><div className="font-medium">JSON (Backup)</div><div className="text-[10px] text-gray-400">Save &amp; import later to edit again</div></div>
            </button>
            <div className="px-3 py-2 mt-1 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-[10px] text-amber-700 leading-relaxed">
                <span className="font-semibold">Tip:</span> To edit this resume later, download the JSON file and keep it safe. You can import it anytime using the upload button to continue editing.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Close template picker on click outside */}
      {showTemplates && (
        <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
      )}
    </div>
  );
}
