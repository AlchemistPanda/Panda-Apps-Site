"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  FileText, Trash2, RotateCw, GripVertical, 
  Download, Loader2, Save, X, Plus, MoveHorizontal
} from "lucide-react";
import type { I18nStrings } from "../lib/types";
import { reorderPages } from "../lib/pdfActions";
import { renderAllPagesAsImages } from "../lib/pdfParser";

interface ToolOrganizeProps {
  t: I18nStrings;
}

interface PageThumbnail {
  index: number; // Original index
  url: string;
  rotation: number;
}

export default function ToolOrganize({ t }: ToolOrganizeProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    
    setFile(f);
    setIsProcessing(true);
    setResultBlob(null);
    
    try {
      const thumbnails = await renderAllPagesAsImages(f, 0.4);
      setPages(thumbnails.map((url, i) => ({ index: i, url, rotation: 0 })));
    } catch (err) {
      console.error(err);
      alert("Failed to load PDF pages");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const deletePage = (idx: number) => {
    setPages(prev => prev.filter((_, i) => i !== idx));
    setResultBlob(null);
  };

  const rotatePage = (idx: number) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
    setResultBlob(null);
  };

  const movePage = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return;
    const newPages = [...pages];
    const [moved] = newPages.splice(from, 1);
    newPages.splice(to, 0, moved);
    setPages(newPages);
    setResultBlob(null);
  };

  const handleSave = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      // Reorder and potentially rotate (rotation needs deeper pdf-lib logic, 
      // but for now we'll implement reordering)
      const result = await reorderPages(file, pages.map(p => p.index));
      setResultBlob(new Blob([result.buffer as any], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organized_${file?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!file) {
    return (
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer rounded-3xl border-2 border-dashed py-20 transition-all duration-300
          ${isDragActive ? "border-accent bg-accent/10 scale-[0.99]" : "border-border/40 hover:border-accent/40 bg-card/20"}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center px-6">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t.toolOrganize}</h3>
          <p className="text-sm text-muted">{t.dropHere}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Grid */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{file.name}</h3>
          <p className="text-xs text-muted">{pages.length} {t.pages}</p>
        </div>
        <button 
          onClick={() => setFile(null)}
          className="p-2 rounded-xl hover:bg-card/80 text-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isProcessing ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-accent">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-medium">{t.parsing}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {pages.map((page, idx) => (
            <div 
              key={`${page.index}-${idx}`}
              className="relative group rounded-xl border border-border/30 bg-card/40 overflow-hidden aspect-[3/4]"
            >
              <img 
                src={page.url} 
                alt={`Page ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300"
                style={{ transform: `rotate(${page.rotation}deg)` }}
              />
              
              {/* Overlays */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-white px-2">#{idx + 1}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => rotatePage(idx)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => deletePage(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Move controls */}
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => movePage(idx, idx - 1)}
                  disabled={idx === 0}
                  className="p-1 rounded-md bg-black/40 text-white disabled:opacity-30"
                >
                  <MoveHorizontal className="h-3 w-3 rotate-180" />
                </button>
                <button 
                  onClick={() => movePage(idx, idx + 1)}
                  disabled={idx === pages.length - 1}
                  className="p-1 rounded-md bg-black/40 text-white disabled:opacity-30"
                >
                  <MoveHorizontal className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      {!isProcessing && (
        <div className="sticky bottom-6 flex gap-3">
          {!resultBlob ? (
            <button
              onClick={handleSave}
              disabled={isSaving || pages.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {t.saveChanges}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
              >
                <Download className="h-5 w-5" />
                {t.download}
              </button>
              <button
                onClick={() => { setFile(null); setPages([]); setResultBlob(null); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card/40 py-4 text-sm font-medium hover:border-accent/30 transition-all"
              >
                {t.convertAnother}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
