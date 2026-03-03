export type OutputFormat = "original" | "jpeg" | "png" | "webp" | "avif";
export type CompressionMode = "balanced" | "aggressive" | "lossless";

export interface CompressionSettings {
  mode: CompressionMode;
  quality: number;         // 0–100
  maxWidthOrHeight: number; // 0 = no limit
  outputFormat: OutputFormat;
  preserveExif: boolean;
  targetSizeKB: number | null; // null = no target
}

export type FileStatus = "pending" | "compressing" | "done" | "error";

export interface CompressedFile {
  id: string;
  originalFile: File;
  originalSize: number;
  originalUrl: string;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedSize: number | null;
  status: FileStatus;
  error: string | null;
  outputFormat: string; // actual mime type used
}

export const FORMAT_OPTIONS: { value: OutputFormat; label: string; mime: string }[] = [
  { value: "original", label: "Original", mime: "" },
  { value: "jpeg",     label: "JPEG",     mime: "image/jpeg" },
  { value: "png",      label: "PNG",      mime: "image/png" },
  { value: "webp",     label: "WebP",     mime: "image/webp" },
  { value: "avif",     label: "AVIF",     mime: "image/avif" },
];

export const MODE_OPTIONS: { value: CompressionMode; label: string; description: string }[] = [
  { value: "lossless",   label: "Lossless",   description: "Zero quality loss — best for logos & screenshots" },
  { value: "balanced",   label: "Balanced",   description: "Maximum savings with barely visible difference — recommended" },
  { value: "aggressive", label: "Aggressive", description: "Smallest file size — ideal for web thumbnails" },
];

export const DEFAULT_SETTINGS: CompressionSettings = {
  mode: "balanced",
  quality: 82,
  maxWidthOrHeight: 0,
  outputFormat: "webp",
  preserveExif: false,
  targetSizeKB: null,
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function savingsPercent(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}
