/* ── Client-side PDF parser using pdf.js ──────────────────────────────── */
import type { PdfType } from "./types";

// We dynamically import pdfjs-dist to avoid SSR issues
let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  // Set up the worker using the CDN URL (avoids bundling issues)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  return pdfjsLib;
}

/** Raw text item with position info from pdf.js */
export interface RawTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  pageNumber: number;
  /** Transform matrix */
  transform: number[];
}

/** Extracted page data */
export interface ExtractedPage {
  pageNumber: number;
  width: number;
  height: number;
  textItems: RawTextItem[];
  hasText: boolean;
  /** Page rendered as image (base64 PNG) for scanned PDFs */
  imageData?: string;
}

/** Full extraction result */
export interface PdfExtractionResult {
  pages: ExtractedPage[];
  totalPages: number;
  pdfType: PdfType;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Extract text and position data from a PDF file using pdf.js
 */
export async function extractPdfContent(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<PdfExtractionResult> {
  const pdfjs = await getPdfjs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  const pages: ExtractedPage[] = [];

  // Get metadata
  const metadata = await pdf.getMetadata().catch(() => null);
  const info = metadata?.info as Record<string, string> | undefined;

  let textPageCount = 0;
  let scanPageCount = 0;

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const textItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if ("str" in item && item.str.trim()) {
        const tx = item.transform;
        // tx = [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const fontSize = Math.abs(tx[3]) || Math.abs(tx[0]) || 12;
        const fontName = ("fontName" in item ? item.fontName : "") as string;
        const isBold = /bold/i.test(fontName) || /\-B$/i.test(fontName);
        const isItalic = /italic|oblique/i.test(fontName) || /\-I$/i.test(fontName);

        textItems.push({
          text: item.str,
          x: tx[4],
          y: viewport.height - tx[5], // Flip Y (PDF origin is bottom-left)
          width: item.width || 0,
          height: fontSize,
          fontSize,
          fontName,
          isBold,
          isItalic,
          pageNumber: i,
          transform: tx,
        });
      }
    }

    const hasText = textItems.length > 5; // At least 5 text items = real text
    if (hasText) textPageCount++;
    else scanPageCount++;

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      textItems,
      hasText,
    });
  }

  // Determine PDF type
  let pdfType: PdfType = "text";
  if (scanPageCount > 0 && textPageCount === 0) pdfType = "scanned";
  else if (scanPageCount > 0 && textPageCount > 0) pdfType = "mixed";

  return {
    pages,
    totalPages,
    pdfType,
    metadata: {
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
    },
  };
}

/**
 * Render a PDF page to a canvas and return as base64 image
 */
export async function renderPageAsImage(
  file: File,
  pageNumber: number,
  scale: number = 2.0
): Promise<string> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

  return canvas.toDataURL("image/png");
}

/**
 * Get total page count of a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:application/pdf;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Render all pages of a PDF to base64 images (thumbnails)
 */
export async function renderAllPagesAsImages(
  file: File,
  scale: number = 0.5,
  onProgress?: (page: number, total: number) => void
): Promise<string[]> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const images: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.7)); // Use JPEG for smaller memory footprint
  }

  return images;
}
