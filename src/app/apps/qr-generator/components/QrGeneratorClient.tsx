"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode,
  Database,
  Paintbrush,
  Download,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { DEFAULT_CONFIG } from "../types";
import type { QrConfig } from "../types";
import { encodeQrData } from "../encode";
import DataInputPanel from "./DataInputPanel";
import StylePanel from "./StylePanel";
import ExportPanel from "./ExportPanel";
import ThemeToggle from "@/components/ThemeToggle";

type Tab = "data" | "style" | "export";

const tabs: { id: Tab; label: string; icon: typeof QrCode }[] = [
  { id: "data", label: "Content", icon: Database },
  { id: "style", label: "Style", icon: Paintbrush },
  { id: "export", label: "Export", icon: Download },
];

export default function QrGeneratorClient() {
  const [config, setConfig] = useState<QrConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<Tab>("data");
  const [qrInstance, setQrInstance] = useState<ReturnType<typeof Object> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateConfig = useCallback((partial: Partial<QrConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // Initialize QR code
  useEffect(() => {
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      const options = getQrOptions(config);
      const qr = new QRCodeStyling(options);
      setQrInstance(qr);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        qr.append(containerRef.current);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update QR code when config changes
  useEffect(() => {
    if (qrInstance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (qrInstance as any).update(getQrOptions(config));
    }
  }, [config, qrInstance]);

  // Download handler for ExportPanel
  const qrRefForExport = useRef<{ download: (ext: string) => void } | null>(
    null
  );
  useEffect(() => {
    if (qrInstance) {
      qrRefForExport.current = {
        download: (ext: string) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (qrInstance as any).download({
            name: "panda-qr-code",
            extension: ext,
          });
        },
      };
    }
  }, [qrInstance]);

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Apps
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
              <QrCode className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  QR Code Generator
                </h1>
                <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Free
                </span>
              </div>
              <p className="text-sm text-muted mt-0.5">
                Create stunning QR codes with custom colors, patterns, and logos
              </p>
            </div>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left: Controls ── */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-border/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === tab.id
                        ? "text-accent border-b-2 border-accent bg-accent/5"
                        : "text-muted hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
                {activeTab === "data" && (
                  <DataInputPanel config={config} onChange={updateConfig} />
                )}
                {activeTab === "style" && (
                  <StylePanel config={config} onChange={updateConfig} />
                )}
                {activeTab === "export" && (
                  <ExportPanel
                    config={config}
                    onChange={updateConfig}
                    qrRef={qrRefForExport}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Preview ── */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="sticky top-24">
              {/* Preview card */}
              <div className="rounded-2xl border border-border/50 bg-card/30 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
                    Live Preview
                  </h2>
                </div>

                {/* QR Code display */}
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    {/* Decorative rings */}
                    <div className="absolute inset-0 -m-8 rounded-3xl border border-border/20" />
                    <div className="absolute inset-0 -m-16 rounded-[2rem] border border-border/10" />

                    {/* QR container */}
                    <div
                      id="qr-preview-container"
                      ref={containerRef}
                      className="relative z-10 rounded-2xl bg-white p-6 shadow-2xl shadow-black/20 [&>canvas]:rounded-lg [&>svg]:rounded-lg"
                      style={{
                        minWidth: Math.min(config.size + 48, 348),
                        minHeight: Math.min(config.size + 48, 348),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </div>
                </div>

                {/* Data preview */}
                <div className="mt-6 rounded-xl border border-border/30 bg-background/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                      Encoded Data
                    </span>
                    <span className="text-[10px] font-mono text-muted/50">
                      {encodeQrData(config).length} chars
                    </span>
                  </div>
                  <p className="text-xs font-mono text-muted break-all leading-relaxed line-clamp-3">
                    {encodeQrData(config) || "Enter data to generate QR code"}
                  </p>
                </div>
              </div>

              {/* ── Info cards ── */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <InfoCard
                  label="Error Level"
                  value={config.errorCorrection}
                />
                <InfoCard label="Size" value={`${config.size}px`} />
                <InfoCard label="Format" value={config.exportFormat.toUpperCase()} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getQrOptions(config: QrConfig) {
  return {
    width: config.size,
    height: config.size,
    data: encodeQrData(config) || "https://pandaapps.com",
    dotsOptions: {
      color: config.fgColor,
      type: config.dotStyle,
    },
    backgroundOptions: {
      color: config.bgColor,
    },
    cornersSquareOptions: {
      color: config.fgColor,
      type: config.cornerSquareStyle,
    },
    cornersDotOptions: {
      color: config.fgColor,
      type: config.cornerDotStyle,
    },
    imageOptions: {
      crossOrigin: "anonymous" as const,
      margin: config.logoMargin,
      imageSize: config.logoSize,
    },
    image: config.logoFile || undefined,
    qrOptions: {
      errorCorrectionLevel: config.errorCorrection,
    },
  };
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/20 p-3 text-center">
      <div className="text-xs font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted mt-0.5">{label}</div>
    </div>
  );
}
