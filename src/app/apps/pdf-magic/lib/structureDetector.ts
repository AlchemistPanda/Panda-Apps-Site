/* ── Structure detector: raw text items → document elements ──── */
import type { RawTextItem, ExtractedPage } from "./pdfParser";
import type { DocElement, ParsedPage, ParsedDocument, PdfType } from "./types";

interface TextLine {
  y: number; items: RawTextItem[]; avgFontSize: number; maxFontSize: number;
  isBold: boolean; isItalic: boolean; text: string; x: number; width: number;
}

const Y_TOL = 3;
const PARA_GAP = 1.5;
const TBL_COL = 3;

function groupIntoLines(items: RawTextItem[]): TextLine[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: TextLine[] = [];
  let cur: RawTextItem[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - cur[0].y) <= Y_TOL) cur.push(sorted[i]);
    else { lines.push(mkLine(cur)); cur = [sorted[i]]; }
  }
  if (cur.length) lines.push(mkLine(cur));
  return lines;
}

function mkLine(items: RawTextItem[]): TextLine {
  items.sort((a, b) => a.x - b.x);
  const sizes = items.map(i => i.fontSize);
  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const last = items[items.length - 1];
  return {
    y: items[0].y, items, avgFontSize: avg, maxFontSize: Math.max(...sizes),
    isBold: items.some(i => i.isBold), isItalic: items.every(i => i.isItalic),
    text: items.map(i => i.text).join(" "), x: items[0].x,
    width: last.x + last.width - items[0].x,
  };
}

function fontStats(lines: TextLine[]) {
  const sizes = lines.map(l => l.avgFontSize).filter(s => s > 0);
  if (!sizes.length) return { bodySize: 12, h1: 20, h2: 16, h3: 14 };
  const freq: Record<number, number> = {};
  sizes.forEach(s => { const r = Math.round(s); freq[r] = (freq[r] || 0) + 1; });
  const bodySize = Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  return { bodySize, h1: bodySize * 1.8, h2: bodySize * 1.4, h3: bodySize * 1.15 };
}

function detectList(line: TextLine) {
  const t = line.text.trim();
  const bm = t.match(/^[\u2022\u2023\u25E6•◦▪▸►●○■□–—-]\s+(.+)/);
  if (bm) return { isList: true, type: "bullet" as const, content: bm[1] };
  const nm = t.match(/^(\d+[.)]\s+|[a-z][.)]\s+)(.+)/i);
  if (nm) return { isList: true, type: "numbered" as const, content: nm[2] };
  return { isList: false, type: "bullet" as const, content: t };
}

function detectTables(lines: TextLine[]): Set<number> {
  const s = new Set<number>();
  for (let start = 0; start < lines.length; start++) {
    const ref = lines[start].items;
    if (ref.length < TBL_COL) continue;
    const refX = ref.map(i => Math.round(i.x / 10) * 10);
    let m = 0;
    for (let j = start + 1; j < Math.min(start + 20, lines.length); j++) {
      const li = lines[j].items;
      if (li.length < TBL_COL) break;
      const lx = li.map(i => Math.round(i.x / 10) * 10);
      const ov = refX.filter(x => lx.some(lx2 => Math.abs(lx2 - x) < 15));
      if (ov.length >= TBL_COL - 1) m++; else break;
    }
    if (m >= 2) for (let j = start; j <= start + m; j++) s.add(j);
  }
  return s;
}

function buildTable(lines: TextLine[]): DocElement {
  const allX: number[] = [];
  lines.forEach(l => l.items.forEach(i => allX.push(Math.round(i.x / 10) * 10)));
  const ux = [...new Set(allX)].sort((a, b) => a - b);
  const bounds: number[] = [0];
  for (let i = 1; i < ux.length; i++) if (ux[i] - ux[i - 1] > 20) bounds.push((ux[i] + ux[i - 1]) / 2);
  bounds.push(Infinity);
  const rows = lines.map(line => {
    const row = Array.from({ length: bounds.length - 1 }, () => ({ text: "" }));
    line.items.forEach(item => {
      for (let c = 0; c < bounds.length - 1; c++) {
        if (item.x >= bounds[c] && item.x < bounds[c + 1]) {
          row[c].text += (row[c].text ? " " : "") + item.text; break;
        }
      }
    });
    return row;
  });
  return { type: "table", tableData: { rows, headerRow: true } };
}

function processPage(page: ExtractedPage): ParsedPage {
  const elements: DocElement[] = [];
  const lines = groupIntoLines(page.textItems);
  if (!lines.length) return { pageNumber: page.pageNumber, elements: [] };
  const { bodySize, h1, h2, h3 } = fontStats(lines);
  const tbl = detectTables(lines);
  let i = 0, pendList: string[] = [], pendType: "bullet" | "numbered" = "bullet";
  const flush = () => { if (pendList.length) { elements.push({ type: "list", listItems: [...pendList], listType: pendType }); pendList = []; } };

  while (i < lines.length) {
    const line = lines[i];
    if (tbl.has(i)) {
      flush(); const s = i; while (i < lines.length && tbl.has(i)) i++;
      elements.push(buildTable(lines.slice(s, i))); continue;
    }
    if (line.avgFontSize >= h1 || (line.avgFontSize >= h2 && line.isBold)) {
      flush();
      elements.push({ type: "heading", level: line.avgFontSize >= h1 ? 1 : 2, content: line.text,
        style: { bold: line.isBold, fontSize: line.avgFontSize, fontFamily: line.items[0]?.fontName } });
      i++; continue;
    }
    if (line.avgFontSize >= h3 && line.isBold && line.text.length < 100) {
      flush();
      elements.push({ type: "heading", level: 3, content: line.text, style: { bold: true, fontSize: line.avgFontSize } });
      i++; continue;
    }
    const lc = detectList(line);
    if (lc.isList) {
      if (pendList.length && pendType !== lc.type) flush();
      pendType = lc.type; pendList.push(lc.content); i++; continue;
    }
    flush();
    const pLines: TextLine[] = [line];
    let j = i;
    while (j + 1 < lines.length) {
      const next = lines[j + 1];
      if (tbl.has(j + 1)) break;
      const gap = next.y - lines[j].y;
      if (gap > 0 && gap < line.avgFontSize * PARA_GAP && Math.abs(next.avgFontSize - bodySize) < 2 && !detectList(next).isList) {
        pLines.push(next); j++;
      } else break;
    }
    const content = pLines.map(l => l.text).join(" ");
    if (content.trim()) {
      elements.push({ type: "paragraph", content,
        style: { bold: line.isBold, italic: line.isItalic, fontSize: line.avgFontSize, fontFamily: line.items[0]?.fontName } });
    }
    i = j + 1;
  }
  flush();
  return { pageNumber: page.pageNumber, elements };
}

function detectLanguage(text: string): string {
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  return "en";
}

export function detectStructure(pages: ExtractedPage[], pdfType: PdfType, totalPages: number): ParsedDocument {
  const allText = pages.map(p => p.textItems.map(i => i.text).join(" ")).join(" ");
  return {
    language: detectLanguage(allText),
    pages: pages.map(p => p.hasText ? processPage(p) : { pageNumber: p.pageNumber, elements: [] }),
    totalPages, pdfType,
  };
}
