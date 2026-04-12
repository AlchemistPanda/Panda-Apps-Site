import type { TextOptions, CanvasSize } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export async function loadFabric() {
  const fabric = await import("fabric");
  return fabric;
}

export function computeDisplayScale(
  canvasSize: CanvasSize,
  containerWidth: number,
  containerHeight: number
): number {
  const scaleX = containerWidth / canvasSize.width;
  const scaleY = containerHeight / canvasSize.height;
  return Math.min(scaleX, scaleY, 1);
}

export async function setBackgroundFromUrl(
  canvas: FabricCanvas,
  url: string
): Promise<void> {
  const { FabricImage } = await loadFabric();

  return new Promise((resolve, reject) => {
    FabricImage.fromURL(
      url,
      { crossOrigin: "anonymous" }
    )
      .then((img: FabricCanvas) => {
        const canvasWidth = canvas.width as number;
        const canvasHeight = canvas.height as number;
        img.scaleToWidth(canvasWidth);
        img.scaleToHeight(canvasHeight);
        img.set({ selectable: false, evented: false });
        canvas.backgroundImage = img;
        canvas.renderAll();
        resolve();
      })
      .catch(reject);
  });
}

export async function addTextObject(
  canvas: FabricCanvas,
  options: Partial<TextOptions> = {}
): Promise<void> {
  const { IText } = await loadFabric();

  const { Shadow } = await loadFabric();
  const obj = new IText(options.text || "Double-click to edit", {
    left: options.left ?? canvas.width / 2,
    top: options.top ?? canvas.height / 2,
    originX: "center",
    originY: "center",
    fontFamily: options.fontFamily || "Poppins",
    fontSize: options.fontSize || 60,
    fill: options.fill || "#ffffff",
    fontWeight: options.fontWeight || "bold",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fontStyle: (options.fontStyle || "normal") as any,
    textAlign: options.textAlign || "center",
    opacity: options.opacity ?? 1,
    shadow: new Shadow({ color: "rgba(0,0,0,0.5)", blur: 6, offsetX: 0, offsetY: 2 }),
  });

  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.renderAll();
}

export async function addImageFromBlob(
  canvas: FabricCanvas,
  blob: Blob
): Promise<void> {
  const { FabricImage } = await loadFabric();
  const url = URL.createObjectURL(blob);

  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  const maxDim = Math.min(canvas.width, canvas.height) * 0.5;
  if (img.width > maxDim || img.height > maxDim) {
    img.scaleToWidth(maxDim);
  }
  img.set({ left: canvas.width / 2, top: canvas.height / 2, originX: "center", originY: "center" });
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.renderAll();
  URL.revokeObjectURL(url);
}

export async function addShape(
  canvas: FabricCanvas,
  type: "rect" | "circle" | "line"
): Promise<void> {
  const { Rect, Circle, Line } = await loadFabric();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  let obj: FabricCanvas;
  if (type === "rect") {
    obj = new Rect({
      left: cx, top: cy, originX: "center", originY: "center",
      width: 300, height: 200, fill: "rgba(255,255,255,0.2)",
      stroke: "#ffffff", strokeWidth: 3,
    });
  } else if (type === "circle") {
    obj = new Circle({
      left: cx, top: cy, originX: "center", originY: "center",
      radius: 120, fill: "rgba(255,255,255,0.2)",
      stroke: "#ffffff", strokeWidth: 3,
    });
  } else {
    obj = new Line([cx - 150, cy, cx + 150, cy], {
      stroke: "#ffffff", strokeWidth: 4,
    });
  }

  canvas.add(obj);
  canvas.setActiveObject(obj);
  canvas.renderAll();
}

export async function loadTemplate(
  canvas: FabricCanvas,
  template: import("./types").PosterTemplate
): Promise<void> {
  canvas.clear();
  canvas.backgroundColor = "#1a1a2e";

  for (const textOpts of template.textObjects) {
    await addTextObject(canvas, textOpts);
  }

  canvas.renderAll();
}

export function exportCanvas(
  canvas: FabricCanvas,
  format: "png" | "jpeg",
  quality: number,
  multiplier: number
): string {
  return canvas.toDataURL({
    format,
    quality,
    multiplier,
  });
}
