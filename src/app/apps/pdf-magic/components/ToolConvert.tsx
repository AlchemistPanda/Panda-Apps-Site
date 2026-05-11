"use client";

import { useState, useCallback } from "react";
import { 
  Zap, Brain, AlertTriangle, Download, 
  RefreshCw, FileText, Loader2, Sparkles 
} from "lucide-react";
import UploadZone from "./UploadZone";
import ProgressIndicator from "./ProgressIndicator";
import DocxPreview from "./DocxPreview";
import type { 
  I18nStrings, ConversionMode, ConversionSettings, 
  ConversionProgress, ParsedDocument 
} from "../lib/types";
import { extractPdfContent, fileToBase64 } from "../lib/pdfParser";
import { detectStructure } from "../lib/structureDetector";
import { buildDocx } from "../lib/docxBuilder";

interface ToolConvertProps {
  t: I18nStrings;
  settings: ConversionSettings;
}

export default function ToolConvert({ t, settings }: ToolConvertProps) {
  const [mode, setMode] = useState<ConversionMode>("quick");
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [scannedWarning, setScannedWarning] = useState(false);

  const isConverting = progress !== null && progress.stage !== "complete" && progress.stage !== "error";

  const reset = useCallback(() => {
    setParsedDoc(null);
    setDocxBlob(null);
    setProgress(null);
    setFileName("");
    setScannedWarning(false);
  }, []);

  const convertQuick = useCallback(async (file: File) => {
    setProgress({ stage: "parsing", progress: 10, message: `Parsing ${file.name}…` });
    const extraction = await extractPdfContent(file, (page, total) => {
      setProgress({ stage: "parsing", progress: 10 + (page / total) * 30, message: `Page ${page} of ${total}` });
    });

    if (extraction.pdfType === "scanned") setScannedWarning(true);

    setProgress({ stage: "analyzing", progress: 50, message: "Detecting structure…" });
    const doc = detectStructure(extraction.pages, extraction.pdfType, extraction.totalPages);
    setParsedDoc(doc);

    setProgress({ stage: "building", progress: 75, message: "Building Word document…" });
    const blob = await buildDocx(doc, settings);
    setDocxBlob(blob);
    setProgress({ stage: "complete", progress: 100, message: "Done!" });
  }, [settings]);

  const convertAI = useCallback(async (file: File) => {
    setProgress({ stage: "uploading", progress: 10, message: `Preparing ${file.name}…` });
    const base64 = await fileToBase64(file);

    setProgress({ stage: "ai-processing", progress: 30, message: "AI is analyzing your document…" });
    const res = await fetch("/api/pdf-convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileData: base64, fileName: file.name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `Server error: ${res.status}`);
    }

    const aiResult = await res.json();
    setProgress({ stage: "analyzing", progress: 70, message: "Processing AI results…" });

    const doc: ParsedDocument = {
      language: aiResult.language,
      pages: (aiResult.pages || []).map((p: any) => ({
        pageNumber: p.pageNumber,
        elements: p.elements,
      })),
      totalPages: aiResult.pages?.length || 0,
      pdfType: "text",
    };

    setParsedDoc(doc);
    setProgress({ stage: "building", progress: 85, message: "Building Word document…" });
    const blob = await buildDocx(doc, settings);
    setDocxBlob(blob);
    setProgress({ stage: "complete", progress: 100, message: "Done!" });
  }, [settings]);

  const handleFileSelected = useCallback(async (file: File) => {
    setFileName(file.name.replace(/\.pdf$/i, ""));
    setScannedWarning(false);
    try {
      if (mode === "ai") await convertAI(file);
      else await convertQuick(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      setProgress({ stage: "error", progress: 0, message });
    }
  }, [mode, convertQuick, convertAI]);

  const handleDownload = () => {
    if (!docxBlob) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {scannedWarning && mode === "quick" && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-300">{t.aiRecommended}</p>
            <p className="text-xs text-muted mt-0.5">{t.scannedWarning}</p>
            <button onClick={() => { setMode("ai"); reset(); }} className="mt-2 text-xs font-semibold text-accent hover:underline">
              Switch to AI mode →
            </button>
          </div>
        </div>
      )}

      {!parsedDoc && !isConverting && progress?.stage !== "error" ? (
        <UploadZone
          onFileSelected={handleFileSelected}
          mode={mode}
          onModeChange={setMode}
          t={t}
          disabled={isConverting}
        />
      ) : (
        <div className="space-y-6">
          {progress && progress.stage !== "complete" && (
            <ProgressIndicator progress={progress} t={t} />
          )}
          {parsedDoc && <DocxPreview doc={parsedDoc} t={t} />}
          {progress?.stage === "complete" && (
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownload} className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20">
                <Download className="h-4 w-4" /> {t.download}
              </button>
              <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-5 py-3 text-sm font-medium hover:border-accent/30 transition-all">
                {t.convertAnother}
              </button>
            </div>
          )}
          {progress?.stage === "error" && (
            <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-5 py-3 text-sm font-medium hover:border-accent/30 transition-all">
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
