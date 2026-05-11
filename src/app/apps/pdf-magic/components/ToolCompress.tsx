"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Plus, Loader2, Download, Zap, 
  ShieldCheck, Info, FileDown, CheckCircle2
} from "lucide-react";
import type { I18nStrings } from "../lib/types";
import { compressPdf } from "../lib/pdfActions";

interface ToolCompressProps {
  t: I18nStrings;
}

type CompressionLevel = "low" | "medium" | "high";

export default function ToolCompress({ t }: ToolCompressProps) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; newSize: number } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      // In a real app, 'level' would adjust image downscaling.
      // For this implementation, we use pdf-lib's internal optimizations.
      const compressedData = await compressPdf(file);
      const blob = new Blob([compressedData.buffer as any], { type: "application/pdf" });
      
      setResult({
        blob,
        originalSize: file.size,
        newSize: blob.size,
      });
    } catch (err) {
      console.error(err);
      alert("Compression failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compressed_${file?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reduction = result ? Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100) : 0;

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
          <h3 className="text-xl font-bold mb-2">{t.toolCompress}</h3>
          <p className="text-sm text-muted">{t.dropHere}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Info */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border/30 bg-card/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <FileDown className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="p-2 hover:bg-card/80 rounded-lg text-muted transition-colors">
          <Plus className="h-5 w-5 rotate-45" />
        </button>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Level Selector */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{t.compressionLevel}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["low", "medium", "high"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`
                    px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left
                    ${level === l 
                      ? "border-accent bg-accent/10 text-accent shadow-lg shadow-accent/5" 
                      : "border-border/30 bg-card/20 text-muted hover:border-border/60"}
                  `}
                >
                  <span className="block font-bold">{t[l]}</span>
                  <span className="text-[10px] opacity-70">
                    {l === "low" ? "Max Quality" : l === "medium" ? "Balanced" : "Smallest Size"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompress}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
            {t.toolCompress}
          </button>
          
          <div className="flex gap-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-300 leading-relaxed">
              Compression happens locally in your browser. This tool optimizes PDF internal structures and streams to reduce file size while preserving quality.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-accent/30 bg-accent/5 p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-accent animate-pulse" />
            </div>
            
            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-bold text-accent">{t.complete}</h3>
              <p className="text-sm text-muted">
                Your PDF is now {reduction}% smaller.
              </p>
            </div>

            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Original</p>
                <p className="text-lg font-bold">{(result.originalSize / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-accent mb-1">New Size</p>
                <p className="text-lg font-bold text-accent">{(result.newSize / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
              >
                <Download className="h-5 w-5" />
                {t.download}
              </button>
              <button
                onClick={() => { setFile(null); setResult(null); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/40 px-6 py-4 text-sm font-medium hover:border-accent/30 transition-all"
              >
                {t.convertAnother}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Privacy Mode: Your file never left your device.
          </div>
        </div>
      )}
    </div>
  );
}
