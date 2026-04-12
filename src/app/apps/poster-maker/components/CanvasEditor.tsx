"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useState,
} from "react";
import type { CanvasSize, PosterTemplate, TextOptions } from "../lib/types";
import {
  loadFabric,
  setBackgroundFromUrl,
  addTextObject,
  addImageFromBlob,
  addShape,
  loadTemplate,
  exportCanvas,
} from "../lib/canvas-helpers";

export interface CanvasEditorHandle {
  setBackground: (url: string) => Promise<void>;
  addText: (options?: Partial<TextOptions>) => Promise<void>;
  addImage: (blob: Blob) => Promise<void>;
  addShape: (type: "rect" | "circle" | "line") => Promise<void>;
  loadTemplate: (template: PosterTemplate) => Promise<void>;
  exportCanvas: (format: "png" | "jpeg", quality: number, multiplier: number) => string;
  bringForward: () => void;
  sendBackward: () => void;
  deleteSelected: () => void;
  getActiveObjectProps: () => ActiveObjectProps | null;
  updateSelectedText: (props: Partial<TextOptions>) => void;
  updateSelectedOpacity: (opacity: number) => void;
}

export interface ActiveObjectProps {
  type: "text" | "image" | "shape";
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  opacity?: number;
}

interface Props {
  canvasSize: CanvasSize;
  onSelectionChange?: (props: ActiveObjectProps | null) => void;
}

const GOOGLE_FONTS = [
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,700;1,700&family=Roboto:wght@400;700&family=Inter:wght@400;700;900&family=Noto+Sans+Malayalam:wght@400;700&family=Manjari:wght@400;700&family=Gayathri&family=Chilanka&display=swap",
];

function injectFonts() {
  if (document.getElementById("poster-maker-fonts")) return;
  const link = document.createElement("link");
  link.id = "poster-maker-fonts";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS[0];
  document.head.appendChild(link);
}

const CanvasEditor = forwardRef<CanvasEditorHandle, Props>(
  ({ canvasSize, onSelectionChange }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricRef = useRef<any>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [displayScale, setDisplayScale] = useState(1);

    const getScale = useCallback(() => {
      // Use container width if available, otherwise estimate from viewport
      const containerW = containerRef.current?.clientWidth ?? Math.min(window.innerWidth * 0.55, 700);
      // Limit canvas display height to 70vh
      const maxH = window.innerHeight * 0.70;
      const scaleX = containerW / canvasSize.width;
      const scaleY = maxH / canvasSize.height;
      return Math.min(scaleX, scaleY, 1);
    }, [canvasSize]);

    // Initialize Fabric.js
    useEffect(() => {
      injectFonts();
      let canvas: typeof fabricRef.current = null;

      // Compute initial scale after DOM is ready
      const initialScale = getScale();
      setDisplayScale(initialScale);

      import("fabric").then(({ Canvas }) => {
        if (!canvasElRef.current) return;

        const scale = getScale();
        setDisplayScale(scale);
        canvas = new Canvas(canvasElRef.current, {
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundColor: "#1a1a2e",
          preserveObjectStacking: true,
        });

        canvas.setZoom(scale);
        canvas.setDimensions({
          width: canvasSize.width * scale,
          height: canvasSize.height * scale,
        });

        fabricRef.current = canvas;

        // Handle window resize
        const handleResize = () => {
          if (!fabricRef.current) return;
          const s = getScale();
          setDisplayScale(s);
          fabricRef.current.setZoom(s);
          fabricRef.current.setDimensions({
            width: canvasSize.width * s,
            height: canvasSize.height * s,
          });
          fabricRef.current.renderAll();
        };
        window.addEventListener("resize", handleResize);

        // Selection event listeners
        const emitSelection = () => {
          if (!onSelectionChange) return;
          const obj = canvas.getActiveObject();
          if (!obj) {
            onSelectionChange(null);
            return;
          }
          const isText = obj.type === "i-text" || obj.type === "text";
          const isImage = obj.type === "image";
          const props: ActiveObjectProps = {
            type: isText ? "text" : isImage ? "image" : "shape",
            text: isText ? obj.text : undefined,
            fontFamily: isText ? obj.fontFamily : undefined,
            fontSize: isText ? obj.fontSize : undefined,
            fill: isText ? obj.fill : (obj.fill as string),
            fontWeight: isText ? obj.fontWeight : undefined,
            fontStyle: isText ? obj.fontStyle : undefined,
            textAlign: isText ? obj.textAlign : undefined,
            opacity: obj.opacity ?? 1,
          };
          onSelectionChange(props);
        };

        canvas.on("selection:created", emitSelection);
        canvas.on("selection:updated", emitSelection);
        canvas.on("object:modified", emitSelection);
        canvas.on("text:changed", emitSelection);
        canvas.on("selection:cleared", () => onSelectionChange?.(null));
      });

      return () => {
        window.removeEventListener("resize", () => {});
        canvas?.dispose();
        fabricRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Resize canvas when canvasSize prop changes
    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const scale = getScale();
      canvas.setWidth(canvasSize.width);
      canvas.setHeight(canvasSize.height);
      canvas.setZoom(scale);
      canvas.setDimensions({
        width: canvasSize.width * scale,
        height: canvasSize.height * scale,
      });
      canvas.renderAll();
    }, [canvasSize, getScale]);

    useImperativeHandle(ref, () => ({
      setBackground: async (url: string) => {
        if (!fabricRef.current) return;
        await setBackgroundFromUrl(fabricRef.current, url);
      },
      addText: async (options?: Partial<TextOptions>) => {
        if (!fabricRef.current) return;
        await addTextObject(fabricRef.current, options);
      },
      addImage: async (blob: Blob) => {
        if (!fabricRef.current) return;
        await addImageFromBlob(fabricRef.current, blob);
      },
      addShape: async (type: "rect" | "circle" | "line") => {
        if (!fabricRef.current) return;
        await addShape(fabricRef.current, type);
      },
      loadTemplate: async (template: PosterTemplate) => {
        if (!fabricRef.current) return;
        await loadTemplate(fabricRef.current, template);
      },
      exportCanvas: (format: "png" | "jpeg", quality: number, multiplier: number) => {
        if (!fabricRef.current) return "";
        const zoom = fabricRef.current.getZoom();
        fabricRef.current.setZoom(1);
        fabricRef.current.setDimensions({
          width: canvasSize.width,
          height: canvasSize.height,
        });
        const dataUrl = exportCanvas(fabricRef.current, format, quality, multiplier);
        const scale = getScale();
        fabricRef.current.setZoom(scale);
        fabricRef.current.setDimensions({
          width: canvasSize.width * scale,
          height: canvasSize.height * scale,
        });
        fabricRef.current.renderAll();
        void zoom;
        return dataUrl;
      },
      bringForward: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.bringObjectForward(obj); canvas.renderAll(); }
      },
      sendBackward: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.sendObjectBackwards(obj); canvas.renderAll(); }
      },
      deleteSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const obj = canvas.getActiveObject();
        if (obj) { canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); }
      },
      getActiveObjectProps: () => {
        const canvas = fabricRef.current;
        if (!canvas) return null;
        const obj = canvas.getActiveObject();
        if (!obj) return null;
        const isText = obj.type === "i-text" || obj.type === "text";
        return {
          type: isText ? "text" : obj.type === "image" ? "image" : "shape",
          text: isText ? obj.text : undefined,
          fontFamily: isText ? obj.fontFamily : undefined,
          fontSize: isText ? obj.fontSize : undefined,
          fill: obj.fill as string,
          fontWeight: isText ? obj.fontWeight : undefined,
          fontStyle: isText ? obj.fontStyle : undefined,
          textAlign: isText ? obj.textAlign : undefined,
          opacity: obj.opacity ?? 1,
        } as ActiveObjectProps;
      },
      updateSelectedText: (props: Partial<TextOptions>) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const obj = canvas.getActiveObject();
        if (!obj) return;
        obj.set(props as Record<string, unknown>);
        canvas.renderAll();
      },
      updateSelectedOpacity: (opacity: number) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const obj = canvas.getActiveObject();
        if (!obj) return;
        obj.set({ opacity });
        canvas.renderAll();
      },
    }));

    return (
      <div ref={containerRef} className="w-full flex items-center justify-center">
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-border/30"
          style={{
            width: canvasSize.width * displayScale,
            height: canvasSize.height * displayScale,
          }}
        >
          <canvas ref={canvasElRef} />
        </div>
      </div>
    );
  }
);

CanvasEditor.displayName = "CanvasEditor";

export default CanvasEditor;
