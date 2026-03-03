"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Toolbar, { type ViewMode, type ToolbarAction } from "./Toolbar";
import Link from "next/link";
import {
  Copy, Download, FileDown, Printer, Plus, Check,
  FileText, Clock, AlignLeft, HelpCircle, X, ChevronLeft,
} from "lucide-react";

/* ── Default content ───────────────────────────────────────────────────── */
const DEFAULT_MD = ``;

const STORAGE_KEY = "panda-markdown-content";
const TITLE_KEY = "panda-markdown-title";
const SAVE_DELAY = 1200; // ms

/* ── Toolbar action → markdown syntax ───────────────────────────── */
function getWrap(
  action: ToolbarAction,
  selected: string
): { prefix: string; suffix: string; placeholder: string; block?: boolean } {
  switch (action) {
    case "bold":      return { prefix: "**",  suffix: "**",  placeholder: "bold text"   };
    case "italic":    return { prefix: "*",   suffix: "*",   placeholder: "italic text"  };
    case "strike":    return { prefix: "~~",  suffix: "~~",  placeholder: "strikethrough"};
    case "code":      return { prefix: "`",   suffix: "`",   placeholder: "code"         };
    case "link":      return { prefix: "[",   suffix: `](${selected ? "" : "url"})`, placeholder: selected ? "" : "link text", block: false };
    case "image":     return { prefix: "![",  suffix: `](${selected ? "" : "url"})`, placeholder: selected ? "" : "alt text",  block: false };
    case "h1":        return { prefix: "# ",  suffix: "",    placeholder: "Heading 1", block: true };
    case "h2":        return { prefix: "## ", suffix: "",    placeholder: "Heading 2", block: true };
    case "h3":        return { prefix: "### ",suffix: "",    placeholder: "Heading 3", block: true };
    case "quote":     return { prefix: "> ",  suffix: "",    placeholder: "Blockquote", block: true };
    case "ul":        return { prefix: "- ",  suffix: "",    placeholder: "List item",  block: true };
    case "ol":        return { prefix: "1. ", suffix: "",    placeholder: "List item",  block: true };
    case "hr":        return { prefix: "\n---\n", suffix: "", placeholder: "", block: true };
    case "codeblock": return {
      prefix: "```\n",
      suffix: "\n```",
      placeholder: "code here",
      block: true,
    };
    case "table":     return {
      prefix: "| Column 1 | Column 2 |\n|----------|----------|\n| ",
      suffix: " | Cell 2   |",
      placeholder: "Cell 1",
      block: true,
    };
  }
}

/* ── Stats helpers ───────────────────────────────────────────────── */
function getStats(text: string) {
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  const readMin = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readMin };
}

/* ── Component ───────────────────────────────────────────────────── */
export default function MarkdownEditorClient() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [title, setTitle]       = useState("Untitled Document");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [renderedHtml, setRenderedHtml] = useState("");
  const [savedAt, setSavedAt]   = useState<string | null>(null);
  const [copied, setCopied]     = useState<"md" | "html" | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Load from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedTitle = localStorage.getItem(TITLE_KEY);
    if (saved) setMarkdown(saved);
    if (savedTitle) setTitle(savedTitle);
  }, []);

  /* Render markdown → HTML */
  useEffect(() => {
    const raw = marked.parse(markdown) as string;
    setRenderedHtml(DOMPurify.sanitize(raw));
  }, [markdown]);

  /* Auto-save (debounced) */
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, markdown);
      localStorage.setItem(TITLE_KEY, title);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSavedAt(now);
    }, SAVE_DELAY);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [markdown, title]);

  /* Toolbar action: insert/wrap text */
  const handleAction = useCallback((action: ToolbarAction) => {
    const el = textareaRef.current;
    if (!el && action !== "hr" && action !== "table") return;

    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = markdown.slice(start, end);
    const before = markdown.slice(0, start);
    const after  = markdown.slice(end);

    const wrap = getWrap(action, sel);
    const inner = sel || wrap.placeholder;
    const inserted = wrap.prefix + inner + wrap.suffix;
    const newMd = before + inserted + after;

    setMarkdown(newMd);

    // Restore cursor after React re-renders
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const newStart = start + wrap.prefix.length;
      const newEnd   = newStart + (sel ? sel.length : wrap.placeholder.length);
      el.setSelectionRange(
        action === "link" || action === "image" ? newStart : newStart,
        action === "link" || action === "image" ? newStart + inner.length : newEnd
      );
    });
  }, [markdown]);

  /* Tab key → insert 2 spaces */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      const newMd = markdown.slice(0, start) + "  " + markdown.slice(end);
      setMarkdown(newMd);
      requestAnimationFrame(() => {
        el.setSelectionRange(start + 2, start + 2);
      });
    }
  }, [markdown]);

  /* ── Exports ──────────────────────────────────────────────────── */
  const downloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyMd = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied("md");
    setTimeout(() => setCopied(null), 1800);
  };

  const downloadHtml = () => {
    const full = buildFullHtml(title, renderedHtml);
    const blob = new Blob([full], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyHtml = async () => {
    await navigator.clipboard.writeText(renderedHtml);
    setCopied("html");
    setTimeout(() => setCopied(null), 1800);
  };

  const printPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildFullHtml(title, renderedHtml, true));
    win.document.close();
    win.onload = () => { win.print(); };
  };

  const newDocument = () => {
    if (markdown !== DEFAULT_MD && !confirm("Start a new document? Unsaved work will be lost.")) return;
    setMarkdown(DEFAULT_MD);
    setTitle("Untitled Document");
  };

  const { words, chars, readMin } = getStats(markdown);

  /* ── Layout classes ───────────────────────────────────────────── */
  const editorClass = viewMode === "preview"
    ? "hidden"
    : viewMode === "split"
    ? "w-1/2 border-r border-border/20"
    : "w-full";

  const previewClass = viewMode === "edit"
    ? "hidden"
    : viewMode === "split"
    ? "w-1/2"
    : "w-full";

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-card/40 px-4 py-2.5 backdrop-blur-sm">
        {/* Back */}
        <Link href="/#apps" className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors shrink-0">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Back</span>
        </Link>
        <span className="text-border/40 text-xs">|</span>
        {/* Icon + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <FileText className="h-3.5 w-3.5 text-white" />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground placeholder-muted focus:outline-none"
            placeholder="Document title"
            maxLength={80}
          />
          {savedAt && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted whitespace-nowrap">
              <Check className="h-3 w-3 text-purple-400" />
              Saved {savedAt}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <HeaderBtn onClick={newDocument} title="New document">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </HeaderBtn>

          <HeaderBtn onClick={copyMd} title="Copy Markdown">
            {copied === "md" ? <Check className="h-3.5 w-3.5 text-purple-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Copy MD</span>
          </HeaderBtn>

          <HeaderBtn onClick={downloadMd} title="Download .md file">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </HeaderBtn>

          <div className="w-px h-4 bg-border/40 mx-0.5" />

          <HeaderBtn onClick={copyHtml} title="Copy rendered HTML">
            {copied === "html" ? <Check className="h-3.5 w-3.5 text-purple-400" /> : <FileDown className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Copy HTML</span>
          </HeaderBtn>

          <HeaderBtn onClick={downloadHtml} title="Download .html file">
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">HTML</span>
          </HeaderBtn>

          <HeaderBtn onClick={printPdf} title="Export as PDF via browser print">
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </HeaderBtn>

          <div className="w-px h-4 bg-border/40 mx-0.5" />

          <HeaderBtn onClick={() => setHelpOpen(true)} title="How to use">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Help</span>
          </HeaderBtn>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <Toolbar onAction={handleAction} viewMode={viewMode} onViewMode={setViewMode} />

      {/* ── Editor / Preview area ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor */}
        <div className={`flex flex-col ${editorClass} overflow-hidden`}>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck
            className="flex-1 resize-none bg-transparent p-4 font-mono text-sm text-foreground/90 leading-relaxed focus:outline-none placeholder-muted overflow-auto"
            placeholder="Start writing Markdown here…"
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Preview */}
        <div className={`${previewClass} overflow-auto bg-[#0f0f12]`}>
          <div
            className="md-preview mx-auto max-w-3xl px-8 py-8"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-t border-border/30 bg-card/30 px-4 py-1.5 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <AlignLeft className="h-3 w-3" />
          {words.toLocaleString()} words
        </span>
        <span>{chars.toLocaleString()} characters</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ~{readMin} min read
        </span>
        <span className="ml-auto hidden sm:block">
          Markdown Editor — PandaApps
        </span>
      </div>

      {/* ── Help Modal ──────────────────────────────────────────────── */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setHelpOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl border border-border/40 bg-[#0f0f12] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <HelpCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold">How to use Markdown Editor</h2>
              </div>
              <button onClick={() => setHelpOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-4 text-sm text-muted">
              <Section title="Writing">
                <Row label="Bold" value="**text** or __text__" />
                <Row label="Italic" value="*text* or _text_" />
                <Row label="Strikethrough" value="~~text~~" />
                <Row label="Inline code" value="`code`" />
                <Row label="Heading" value="# H1 &nbsp; ## H2 &nbsp; ### H3" />
                <Row label="Blockquote" value="> your quote" />
                <Row label="Horizontal rule" value="---" />
              </Section>
              <Section title="Lists">
                <Row label="Unordered" value="- item (or * item)" />
                <Row label="Ordered" value="1. item" />
                <Row label="Nested" value="indent with 2 spaces" />
              </Section>
              <Section title="Links & Images">
                <Row label="Link" value="[label](url)" />
                <Row label="Image" value="![alt](url)" />
              </Section>
              <Section title="Code blocks">
                <Row label="Fenced block" value="``` lang ... ```" />
              </Section>
              <Section title="Tables">
                <Row label="Syntax" value="| Col | Col |" />
                <Row label="Divider" value="|-----|-----|" />
              </Section>
              <Section title="Keyboard shortcuts">
                <Row label="Tab" value="Inserts 2 spaces" />
                <Row label="Auto-save" value="Every 1.2 s after typing" />
              </Section>
              <Section title="Export">
                <Row label="Download" value="Saves .md file" />
                <Row label="Copy HTML" value="Rendered HTML to clipboard" />
                <Row label="HTML file" value="Full standalone HTML page" />
                <Row label="PDF" value="Print dialog → Save as PDF" />
              </Section>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Small helper components ─────────────────────────────────────── */
function HeaderBtn({
  onClick, title, children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/20 px-2.5 py-1 text-xs font-medium text-muted hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 transition-all"
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">{title}</p>
      <div className="rounded-xl border border-border/30 bg-card/20 divide-y divide-border/20">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <code className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">{value}</code>
    </div>
  );
}

/* ── Full HTML document builder ──────────────────────────────────── */
function buildFullHtml(title: string, body: string, forPrint = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.75;
    color: #e2e8f0;
    background: ${forPrint ? "#fff" : "#0f0f12"};
    ${forPrint ? "color: #1a202c;" : ""}
    padding: 3rem 1.5rem;
    max-width: 800px;
    margin: 0 auto;
  }
  h1, h2, h3, h4, h5, h6 { font-weight: 700; line-height: 1.3; margin: 1.5em 0 0.5em; }
  h1 { font-size: 2em; border-bottom: 2px solid ${forPrint ? "#e2e8f0" : "#334155"}; padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid ${forPrint ? "#e2e8f0" : "#1e293b"}; padding-bottom: 0.2em; }
  h3 { font-size: 1.25em; }
  p { margin: 0.75em 0; }
  a { color: #a78bfa; text-decoration: underline; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  del { text-decoration: line-through; opacity: 0.7; }
  code { background: ${forPrint ? "#f1f5f9" : "#1e1b2e"}; color: ${forPrint ? "#581c87" : "#c4b5fd"}; padding: 0.15em 0.45em; border-radius: 4px; font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 0.875em; }
  pre { background: ${forPrint ? "#f8fafc" : "#13111c"}; border: 1px solid ${forPrint ? "#e2e8f0" : "#2d2040"}; border-radius: 8px; padding: 1em 1.25em; overflow-x: auto; margin: 1.25em 0; }
  pre code { background: none; color: ${forPrint ? "#1a202c" : "#e2e8f0"}; padding: 0; font-size: 0.875em; }
  blockquote { border-left: 3px solid #7c3aed; margin: 1em 0; padding: 0.5em 1em; background: ${forPrint ? "#f5f3ff" : "#1a1730"}; color: ${forPrint ? "#4c1d95" : "#c4b5fd"}; border-radius: 0 6px 6px 0; }
  ul, ol { margin: 0.75em 0; padding-left: 1.75em; }
  li { margin: 0.25em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1.25em 0; font-size: 0.9em; }
  th, td { border: 1px solid ${forPrint ? "#cbd5e1" : "#334155"}; padding: 0.5em 0.75em; }
  th { background: ${forPrint ? "#f1f5f9" : "#1e293b"}; font-weight: 600; }
  tr:nth-child(even) td { background: ${forPrint ? "#f8fafc" : "#0f0f12"}; }
  hr { border: none; border-top: 1px solid ${forPrint ? "#e2e8f0" : "#334155"}; margin: 2em 0; }
  img { max-width: 100%; border-radius: 8px; }
  ${forPrint ? "@media print { body { padding: 1rem; } }" : ""}
</style>
</head>
<body>
${body}
</body>
</html>`;
}
