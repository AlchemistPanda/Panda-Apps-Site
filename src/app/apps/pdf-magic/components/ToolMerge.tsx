"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  FileText, Plus, X, ArrowUp, ArrowDown, 
  GripVertical, Download, Loader2, Sparkles 
} from "lucide-react";
import type { I18nStrings } from "../lib/types";
import { mergePdfs } from "../lib/pdfActions";

interface ToolMergeProps {
  t: I18nStrings;
}

interface MergeFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function ToolMerge({ t }: ToolMergeProps) {
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      name: f.name,
      size: f.size
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setMergedBlob(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedBlob(null);
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles);
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    try {
      const result = await mergePdfs(files.map(f => f.file));
      setMergedBlob(new Blob([result.buffer as any], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      alert("Merge failed");
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged_document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300
          ${isDragActive ? "border-accent bg-accent/10 scale-[0.99]" : "border-border/40 hover:border-accent/40 bg-card/20"}
          ${files.length > 0 ? "py-8" : "py-20"}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center px-6">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t.addMoreFiles}</h3>
          <p className="text-sm text-muted">{t.dropHere}</p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files ({files.length})
            </h4>
            <span className="text-[10px] text-muted/50">{t.reorderFiles}</span>
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div 
                key={file.id}
                className="flex items-center gap-4 p-3 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => moveFile(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-card/80 text-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => moveFile(idx, "down")}
                    disabled={idx === files.length - 1}
                    className="p-1.5 rounded-lg hover:bg-card/80 text-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      {files.length >= 2 && !mergedBlob && (
        <button
          onClick={handleMerge}
          disabled={isMerging}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
        >
          {isMerging ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {t.mergeNow}
        </button>
      )}

      {/* Result */}
      {mergedBlob && (
        <div className="rounded-3xl border border-accent/30 bg-accent/5 p-6 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <Download className="h-8 w-8 text-accent animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-accent mb-2">{t.complete}</h3>
          <p className="text-sm text-muted mb-6">Your files have been merged into a single PDF.</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black hover:bg-accent-light transition-colors"
            >
              <Download className="h-4 w-4" />
              {t.download}
            </button>
            <button
              onClick={() => { setFiles([]); setMergedBlob(null); }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/40 px-6 py-3 text-sm font-medium hover:border-accent/30 transition-all"
            >
              {t.convertAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
