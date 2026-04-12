export type ExportFormat = "png" | "jpeg";

export type CanvasPresetId =
  | "instagram-post"
  | "instagram-story"
  | "facebook"
  | "a4-portrait"
  | "custom";

export interface CanvasSize {
  width: number;
  height: number;
}

export const CANVAS_PRESETS: { id: CanvasPresetId; label: string; size: CanvasSize }[] = [
  { id: "instagram-post", label: "Instagram Post (1:1)", size: { width: 1080, height: 1080 } },
  { id: "instagram-story", label: "Instagram Story (9:16)", size: { width: 1080, height: 1920 } },
  { id: "facebook", label: "Facebook Cover (16:9)", size: { width: 1200, height: 630 } },
  { id: "a4-portrait", label: "A4 Portrait", size: { width: 2480, height: 3508 } },
  { id: "custom", label: "Custom", size: { width: 1080, height: 1080 } },
];

export interface TextOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: "left" | "center" | "right";
  left?: number;
  top?: number;
  opacity?: number;
}

export interface PosterTemplate {
  id: string;
  name: string;
  category: string;
  emoji: string;
  canvasSize: CanvasSize;
  defaultPrompt: string;
  gradient: string;
  textObjects: TextOptions[];
}

export type ActiveTab = "prompt" | "text" | "elements" | "export";

export interface SelectedObjectProps {
  type: "text" | "image" | "shape" | null;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  opacity?: number;
}
