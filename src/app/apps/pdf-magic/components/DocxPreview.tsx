"use client";

import { useMemo } from "react";
import type { ParsedDocument, I18nStrings } from "../lib/types";
import { FileText, Table, List, Heading, Type, Globe } from "lucide-react";

interface DocxPreviewProps {
  doc: ParsedDocument;
  t: I18nStrings;
}

export default function DocxPreview({ doc, t }: DocxPreviewProps) {
  const stats = useMemo(() => {
    let headings = 0, paragraphs = 0, tables = 0, lists = 0;
    for (const page of doc.pages) {
      for (const el of page.elements) {
        if (el.type === "heading") headings++;
        else if (el.type === "paragraph") paragraphs++;
        else if (el.type === "table") tables++;
        else if (el.type === "list") lists++;
      }
    }
    return { headings, paragraphs, tables, lists };
  }, [doc]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 bg-card/50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">{t.preview}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{doc.totalPages} {t.pages}</span>
          {doc.language && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {doc.language.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-border/20 bg-card/20">
        {stats.headings > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-violet-500/10 text-violet-400 rounded-full px-2.5 py-1">
            <Heading className="h-3 w-3" /> {stats.headings}
          </span>
        )}
        {stats.paragraphs > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 rounded-full px-2.5 py-1">
            <Type className="h-3 w-3" /> {stats.paragraphs}
          </span>
        )}
        {stats.tables > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 rounded-full px-2.5 py-1">
            <Table className="h-3 w-3" /> {stats.tables}
          </span>
        )}
        {stats.lists > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 rounded-full px-2.5 py-1">
            <List className="h-3 w-3" /> {stats.lists}
          </span>
        )}
      </div>

      {/* Content preview */}
      <div className="max-h-[500px] overflow-y-auto p-5 space-y-1">
        {doc.pages.map((page) => (
          <div key={page.pageNumber}>
            {page.pageNumber > 1 && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[10px] text-muted/50 font-medium">Page {page.pageNumber}</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
            )}
            {page.elements.map((el, i) => {
              if (el.type === "heading") {
                const sizes: Record<number, string> = { 1: "text-xl font-bold", 2: "text-lg font-bold", 3: "text-base font-semibold" };
                return (
                  <p key={i} className={`${sizes[el.level || 3] || "text-base font-semibold"} mt-3 mb-1 text-foreground`}>
                    {el.content}
                  </p>
                );
              }
              if (el.type === "paragraph") {
                return (
                  <p key={i} className={`text-sm text-foreground/80 mb-2 leading-relaxed ${el.style?.bold ? "font-semibold" : ""} ${el.style?.italic ? "italic" : ""}`}>
                    {el.content}
                  </p>
                );
              }
              if (el.type === "list") {
                return (
                  <ul key={i} className={`text-sm text-foreground/80 mb-2 pl-5 ${el.listType === "numbered" ? "list-decimal" : "list-disc"}`}>
                    {el.listItems?.map((item, j) => <li key={j} className="mb-0.5">{item}</li>)}
                  </ul>
                );
              }
              if (el.type === "table" && el.tableData) {
                return (
                  <div key={i} className="overflow-x-auto mb-3 rounded-lg border border-border/30">
                    <table className="w-full text-xs">
                      <tbody>
                        {el.tableData.rows.map((row, ri) => (
                          <tr key={ri} className={ri === 0 && el.tableData!.headerRow ? "bg-card/60 font-semibold" : ri % 2 ? "bg-card/20" : ""}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="border border-border/20 px-2 py-1.5">{cell.text}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
        {doc.pages.every(p => p.elements.length === 0) && (
          <div className="text-center py-8 text-muted">
            <p className="text-sm">No previewable content extracted.</p>
            <p className="text-xs mt-1">Try AI mode for scanned PDFs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
