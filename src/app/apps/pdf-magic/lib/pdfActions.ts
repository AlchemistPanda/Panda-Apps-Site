import { PDFDocument, rgb } from "pdf-lib";

/**
 * Merge multiple PDF files into one
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Remove specific pages from a PDF
 */
export async function removePages(file: File, pageIndicesToRemove: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // Sort indices in descending order to avoid shift issues
  const sortedIndices = [...pageIndicesToRemove].sort((a, b) => b - a);
  sortedIndices.forEach((index) => pdf.removePage(index));

  return await pdf.save();
}

/**
 * Rotate specific pages in a PDF
 */
export async function rotatePages(
  file: File, 
  rotations: Record<number, number> // pageIndex -> degrees (90, 180, 270)
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  Object.entries(rotations).forEach(([indexStr, degrees]) => {
    const index = parseInt(indexStr);
    const page = pdf.getPage(index);
    const currentRotation = page.getRotation().angle;
    page.setRotation({ angle: (currentRotation + degrees) % 360 } as any);
  });

  return await pdf.save();
}

/**
 * Reorder pages in a PDF
 */
export async function reorderPages(file: File, newOrder: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const copiedPages = await newPdf.copyPages(srcPdf, newOrder);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * Simple PDF compression (client-side)
 * Note: Real compression usually involves server-side tools like Ghostscript.
 * This helper removes unused objects and can be extended to downscale images.
 */
export async function compressPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // pdf-lib's save() with compression options
  return await pdf.save({ 
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false
  });
}
