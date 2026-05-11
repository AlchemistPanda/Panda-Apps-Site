import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Magic — Panda Apps",
  description:
    "The ultimate PDF tool suite. Convert to Word, merge files, delete/organize pages, compress, and edit PDFs. 100% free, privacy-focused, and AI-powered.",
};

export default function PdfToWordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
