"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Plus, Loader2, Download, Type, 
  PenTool, Trash2, 
  ChevronLeft, ChevronRight, Save, X
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import type { I18nStrings } from "../lib/types";
import { renderPageAsImage, getPdfPageCount } from "../lib/pdfParser";

interface ToolEditProps {
  t: I18nStrings;
}

export default function ToolEdit({ t }: ToolEditProps) {
  const [file, setFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const [pageImage, setPageImage] = useState<string | null>(null);

  // Initialize Fabric.js dynamically
  const initFabric = useCallback(async (width: number, height: number) => {
    if (!canvasElRef.current) return;
    
    const { Canvas } = await import("fabric");
    if (fabricRef.current) {
      fabricRef.current.dispose();
    }
    
    const canvas = new Canvas(canvasElRef.current, {
      width,
      height,
      preserveObjectStacking: true,
    });
    
    fabricRef.current = canvas;
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setIsProcessing(true);
    try {
      const count = await getPdfPageCount(f);
      setTotalPages(count);
      setCurrentPage(1);
      await loadPage(f, 1);
    } catch (err) {
      alert("Failed to load PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPage = async (f: File, pageNum: number) => {
    setIsProcessing(true);
    try {
      const img = await renderPageAsImage(f, pageNum, 1.5);
      setPageImage(img);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (file) loadPage(file, currentPage);
  }, [currentPage]);

  const addText = async () => {
    if (!fabricRef.current) return;
    const { IText } = await import("fabric");
    const text = new IText("Type something...", {
      left: 50,
      top: 50,
      fontSize: 24,
      fill: "#000000",
      fontFamily: "Arial",
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  };

  const toggleDrawing = () => {
    if (!fabricRef.current) return;
    fabricRef.current.isDrawingMode = !fabricRef.current.isDrawingMode;
    if (fabricRef.current.isDrawingMode) {
      // Setup pencil brush
      // In fabric v6/v7, the brush is often configured via PencilBrush
      import("fabric").then(({ PencilBrush }) => {
        const brush = new PencilBrush(fabricRef.current);
        brush.width = 3;
        brush.color = "#000000";
        fabricRef.current.freeDrawingBrush = brush;
      });
    }
  };

  const deleteSelected = () => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObjects();
    fabricRef.current.remove(...active);
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();
  };

  const handleSave = async () => {
    if (!file || !fabricRef.current) return;
    setIsSaving(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const page = pdfDoc.getPage(currentPage - 1);
      const { width, height } = page.getSize();

      // Export fabric to data URL at high scale
      const zoom = fabricRef.current.getZoom();
      fabricRef.current.setZoom(1);
      const annotations = fabricRef.current.toDataURL({ format: "png", multiplier: 2 });
      fabricRef.current.setZoom(zoom);

      const annotationImage = await pdfDoc.embedPng(annotations);

      // Draw onto the PDF page
      page.drawImage(annotationImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      const pdfBytes = await pdfDoc.save();
      setResultBlob(new Blob([pdfBytes.buffer as any], { type: "application/pdf" }));
    } catch (err) {
      console.error(err);
      alert("Failed to save PDF");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edited_${file?.name || "document.pdf"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!file) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-card/20 group hover:border-accent/40 transition-all cursor-pointer" onClick={() => document.getElementById("edit-upload")?.click()}>
        <input type="file" id="edit-upload" className="hidden" accept=".pdf" onChange={onFileChange} />
        <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <PenTool className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold mb-2">{t.toolEdit}</h3>
        <p className="text-sm text-muted">Select a PDF to sign or annotate</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm">
        <button onClick={addText} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-card/60 text-sm font-medium">
          <Type className="h-4 w-4" /> Text
        </button>
        <button 
          onClick={toggleDrawing} 
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${fabricRef.current?.isDrawingMode ? "bg-accent text-black" : "hover:bg-card/60"}`}
        >
          <PenTool className="h-4 w-4" /> Sign
        </button>
        <div className="h-6 w-px bg-border/40 mx-1" />
        <button onClick={deleteSelected} className="p-2 rounded-xl hover:bg-red-500/10 text-muted hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-3">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 rounded-xl hover:bg-card/80 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold">{currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-xl hover:bg-card/80 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="relative rounded-2xl border border-border/30 bg-white overflow-hidden flex items-center justify-center min-h-[500px]">
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className="relative shadow-2xl"
          style={{ width: "fit-content", height: "fit-content" }}
        >
          {pageImage && (
            <img 
              src={pageImage} 
              alt="PDF Page" 
              className="block pointer-events-none" 
              onLoad={(e) => {
                const img = e.currentTarget;
                initFabric(img.clientWidth, img.clientHeight);
              }}
            />
          )}
          <div className="absolute inset-0">
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3">
        {!resultBlob ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save & Export
          </button>
        ) : (
          <>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-black hover:bg-accent-light transition-all shadow-lg shadow-accent/20"
            >
              <Download className="h-5 w-5" />
              Download Edited PDF
            </button>
            <button
              onClick={() => { setFile(null); setResultBlob(null); setPageImage(null); fabricRef.current?.dispose(); fabricRef.current = null; }}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-card/40 py-4 text-sm font-medium hover:border-accent/30 transition-all"
            >
              New Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
