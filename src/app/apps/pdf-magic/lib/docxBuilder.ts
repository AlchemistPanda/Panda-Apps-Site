/* ── DOCX Builder: structured doc → Word file ──────────────────────────── */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  type IParagraphOptions,
} from "docx";
import type { ParsedDocument, ConversionSettings, DocElement } from "./types";

const TWIPS_PER_INCH = 1440;
const HALF_POINTS_PER_PT = 2;

function ptToHalfPts(pt: number) { return Math.round(pt * HALF_POINTS_PER_PT); }

function headingLevel(level: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  const map: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4, 5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6,
  };
  return map[level] || HeadingLevel.HEADING_3;
}

function buildParagraph(el: DocElement, settings: ConversionSettings): Paragraph {
  const text = el.content || "";
  const style = el.style || {};
  return new Paragraph({
    spacing: { after: 120, line: Math.round(settings.lineSpacing * 240) },
    children: [
      new TextRun({
        text,
        font: settings.fontFamily,
        size: ptToHalfPts(settings.fontSize),
        bold: style.bold,
        italics: style.italic,
      }),
    ],
  });
}

function buildHeading(el: DocElement, settings: ConversionSettings): Paragraph {
  const text = el.content || "";
  const level = el.level || 1;
  const sizes: Record<number, number> = { 1: 24, 2: 20, 3: 16, 4: 14, 5: 12, 6: 11 };
  return new Paragraph({
    heading: headingLevel(level),
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        font: settings.headingFont,
        size: ptToHalfPts(sizes[level] || settings.fontSize),
        bold: true,
      }),
    ],
  });
}

function buildList(el: DocElement, settings: ConversionSettings): Paragraph[] {
  const items = el.listItems || [];
  return items.map(
    (item) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: item,
            font: settings.fontFamily,
            size: ptToHalfPts(settings.fontSize),
          }),
        ],
      })
  );
}

function buildTable(el: DocElement, settings: ConversionSettings): Table {
  const data = el.tableData;
  if (!data || !data.rows.length) {
    return new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph("")] })] })] });
  }
  const colCount = Math.max(...data.rows.map((r) => r.length));
  const colWidth = Math.floor(9000 / colCount);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: data.rows.map((row, rowIdx) =>
      new TableRow({
        children: Array.from({ length: colCount }, (_, c) => {
          const cell = row[c];
          const isHeader = data.headerRow && rowIdx === 0;
          return new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: cell?.text || "",
                    font: settings.fontFamily,
                    size: ptToHalfPts(settings.fontSize),
                    bold: isHeader,
                  }),
                ],
              }),
            ],
          });
        }),
      })
    ),
  });
}

/**
 * Build a DOCX blob from a ParsedDocument and settings
 */
export async function buildDocx(doc: ParsedDocument, settings: ConversionSettings): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  for (let pi = 0; pi < doc.pages.length; pi++) {
    const page = doc.pages[pi];

    // Add page break between pages (except first)
    if (pi > 0) {
      children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
    }

    for (const el of page.elements) {
      switch (el.type) {
        case "heading":
          if (settings.detectHeadings) children.push(buildHeading(el, settings));
          else children.push(buildParagraph(el, settings));
          break;
        case "paragraph":
          children.push(buildParagraph(el, settings));
          break;
        case "list":
          if (settings.detectLists) children.push(...buildList(el, settings));
          else {
            const items = el.listItems || [];
            children.push(buildParagraph({ ...el, content: items.join("\n") }, settings));
          }
          break;
        case "table":
          if (settings.detectTables) children.push(buildTable(el, settings));
          else {
            // Flatten table to paragraphs
            const rows = el.tableData?.rows || [];
            for (const row of rows) {
              children.push(
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({
                      text: row.map((c) => c.text).join("  |  "),
                      font: settings.fontFamily,
                      size: ptToHalfPts(settings.fontSize),
                    }),
                  ],
                })
              );
            }
          }
          break;
        default:
          if (el.content) children.push(buildParagraph(el, settings));
      }
    }
  }

  // Fallback if no content
  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: "(No extractable content found)", font: settings.fontFamily, size: ptToHalfPts(settings.fontSize), color: "999999" })] }));
  }

  const pageW = settings.pageSize === "a4" ? 11906 : 12240;
  const pageH = settings.pageSize === "a4" ? 16838 : 15840;

  const document = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: settings.marginTop * TWIPS_PER_INCH,
            bottom: settings.marginBottom * TWIPS_PER_INCH,
            left: settings.marginLeft * TWIPS_PER_INCH,
            right: settings.marginRight * TWIPS_PER_INCH,
          },
          size: { width: pageW, height: pageH },
        },
      },
      children,
    }],
  });

  return await Packer.toBlob(document);
}
