"use client";

import type { ConversionProgress, I18nStrings } from "../lib/types";
import { Loader2, CheckCircle2, XCircle, Upload, Search, Cpu, Bot, FileOutput } from "lucide-react";

interface ProgressIndicatorProps {
  progress: ConversionProgress;
  t: I18nStrings;
}

const stages = [
  { key: "uploading", icon: Upload },
  { key: "parsing", icon: Search },
  { key: "analyzing", icon: Cpu },
  { key: "ai-processing", icon: Bot },
  { key: "building", icon: FileOutput },
] as const;

export default function ProgressIndicator({ progress, t }: ProgressIndicatorProps) {
  const stageMessages: Record<string, string> = {
    uploading: t.uploading,
    parsing: t.parsing,
    analyzing: t.analyzing,
    "ai-processing": t.aiProcessing,
    building: t.building,
    complete: t.complete,
    error: t.error,
  };

  const currentIdx = stages.findIndex((s) => s.key === progress.stage);

  if (progress.stage === "complete") {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3 animate-bounce" />
        <p className="text-lg font-semibold text-accent">{t.complete}</p>
      </div>
    );
  }

  if (progress.stage === "error") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-lg font-semibold text-red-400">{t.error}</p>
        <p className="text-sm text-muted mt-2">{progress.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 sm:p-8">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 rounded-full bg-border/30 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2 text-right">{Math.round(progress.progress)}%</p>
      </div>

      {/* Stage indicators */}
      <div className="flex items-center justify-between mb-6">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;

          return (
            <div key={stage.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`
                  h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isActive ? "bg-accent/20 border border-accent/40 scale-110" : ""}
                  ${isDone ? "bg-accent/10 border border-accent/20" : ""}
                  ${!isActive && !isDone ? "bg-card/50 border border-border/30" : ""}
                `}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                ) : (
                  <Icon className="h-5 w-5 text-muted/50" />
                )}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                isActive ? "text-accent" : isDone ? "text-accent/60" : "text-muted/50"
              }`}>
                {stage.key === "ai-processing" ? "AI" : stage.key.charAt(0).toUpperCase() + stage.key.slice(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current message */}
      <div className="text-center">
        <p className="text-sm font-medium">{stageMessages[progress.stage] || progress.message}</p>
        <p className="text-xs text-muted mt-1">{progress.message}</p>
      </div>
    </div>
  );
}
