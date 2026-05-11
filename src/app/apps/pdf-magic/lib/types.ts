/* ── PDF → Word converter types ────────────────────────────────────────── */

/** Conversion mode */
export type ConversionMode = "quick" | "ai";

/** Tool types */
export type PdfTool = "convert" | "merge" | "organize" | "compress" | "edit";

/** Detected PDF type */
export type PdfType = "text" | "scanned" | "mixed";

/** Element type in a parsed document */
export type ElementType = "heading" | "paragraph" | "table" | "list" | "image" | "pageBreak";

/** Text alignment */
export type TextAlignment = "left" | "center" | "right" | "justify";

/** List type */
export type ListType = "bullet" | "numbered";

/** Style info for a text element */
export interface ElementStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  alignment?: TextAlignment;
  color?: string;
  lineHeight?: number;
}

/** A single run of styled text within an element */
export interface TextRun {
  text: string;
  style?: Partial<ElementStyle>;
}

/** Table cell */
export interface TableCell {
  text: string;
  style?: Partial<ElementStyle>;
  colSpan?: number;
  rowSpan?: number;
}

/** Parsed document element */
export interface DocElement {
  type: ElementType;
  /** Heading level (1-6) */
  level?: number;
  /** Plain text content */
  content?: string;
  /** Rich text runs */
  runs?: TextRun[];
  /** Style for the element as a whole */
  style?: ElementStyle;
  /** Table data */
  tableData?: {
    rows: TableCell[][];
    headerRow?: boolean;
  };
  /** List items */
  listItems?: string[];
  listType?: ListType;
  /** Image data (base64) */
  imageData?: string;
  imageMimeType?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/** A single parsed page */
export interface ParsedPage {
  pageNumber: number;
  elements: DocElement[];
}

/** Full parsed document */
export interface ParsedDocument {
  language?: string;
  pages: ParsedPage[];
  /** Metadata */
  totalPages: number;
  pdfType: PdfType;
}

/** Conversion settings */
export interface ConversionSettings {
  fontFamily: string;
  fontSize: number;
  headingFont: string;
  lineSpacing: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  preserveImages: boolean;
  detectTables: boolean;
  detectLists: boolean;
  detectHeadings: boolean;
  pageSize: "letter" | "a4";
}

/** Conversion progress */
export interface ConversionProgress {
  stage: "uploading" | "parsing" | "analyzing" | "ai-processing" | "building" | "complete" | "error";
  progress: number; // 0-100
  message: string;
}

/** Default conversion settings */
export const DEFAULT_SETTINGS: ConversionSettings = {
  fontFamily: "Calibri",
  fontSize: 11,
  headingFont: "Calibri",
  lineSpacing: 1.15,
  marginTop: 1,
  marginBottom: 1,
  marginLeft: 1,
  marginRight: 1,
  preserveImages: true,
  detectTables: true,
  detectLists: true,
  detectHeadings: true,
  pageSize: "a4",
};

/** Available fonts */
export const FONT_OPTIONS = [
  "Calibri",
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Georgia",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
  "Cambria",
  "Garamond",
];

/** i18n translations */
export interface I18nStrings {
  title: string;
  subtitle: string;
  dropHere: string;
  orClickBrowse: string;
  maxSize: string;
  quickMode: string;
  aiMode: string;
  privacyMode: string;
  quickModeDesc: string;
  aiModeDesc: string;
  privacyModeDesc: string;
  converting: string;
  download: string;
  preview: string;
  settings: string;
  font: string;
  fontSize: string;
  headingFont: string;
  lineSpacing: string;
  margins: string;
  pageSize: string;
  preserveImages: string;
  detectTables: string;
  detectLists: string;
  detectHeadings: string;
  convertAnother: string;
  uploading: string;
  parsing: string;
  analyzing: string;
  aiProcessing: string;
  building: string;
  complete: string;
  error: string;
  scannedWarning: string;
  aiRecommended: string;
  privacyNote: string;
  pages: string;
  detectedLang: string;
  top: string;
  bottom: string;
  left: string;
  right: string;
  // Tool names
  toolConvert: string;
  toolMerge: string;
  toolOrganize: string;
  toolCompress: string;
  toolEdit: string;
  // Merge tool
  addMoreFiles: string;
  mergeNow: string;
  reorderFiles: string;
  // Organize tool
  rotate: string;
  delete: string;
  saveChanges: string;
  // Compress tool
  compressionLevel: string;
  low: string;
  medium: string;
  high: string;
}
