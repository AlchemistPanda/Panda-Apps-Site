import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, TabStopType, TabStopPosition, UnderlineType,
  type IParagraphOptions, type IRunOptions,
} from "docx";
import type { ResumeData } from "../data/types";

/* ── helpers ──────────────────────────────────────────────────────────── */
function fmtDate(d: string): string {
  if (!d) return "";
  const [y, m] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
}

function dateRange(start: string, end: string, current?: boolean): string {
  const s = fmtDate(start);
  const e = current ? "Present" : fmtDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

function hexToRGB(hex: string): string {
  return hex.replace("#", "");
}

function bullet(text: string, opts?: Partial<IParagraphOptions>): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    ...opts,
    children: [new TextRun({ text, size: 20, font: "Calibri" })],
  });
}

/** Splits text by newlines, detecting bullet lines (- , • , * ) */
function richTextParagraphs(text: string, color = "444444"): Paragraph[] {
  const result: Paragraph[] = [];
  for (const line of text.split("\n")) {
    const bulletMatch = line.match(/^\s*[-•*]\s+(.*)/);
    if (bulletMatch) {
      result.push(bullet(bulletMatch[1]));
    } else if (line.trim()) {
      result.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: line, size: 20, font: "Calibri", color })],
        })
      );
    }
  }
  return result;
}

function sectionHeading(title: string, color: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: hexToRGB(color), space: 4 } },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 20,
        font: "Calibri",
        color: hexToRGB(color),
        characterSpacing: 60,
      }),
    ],
  });
}

/* ── main export ──────────────────────────────────────────────────────── */
export async function generateDocx(data: ResumeData): Promise<Blob> {
  const { personal: p, sections: vis, accentColor: accent } = data;
  const ac = hexToRGB(accent);
  const paragraphs: Paragraph[] = [];

  /* ─── Header ─── */
  // Name
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: p.fullName || "Your Name",
          bold: true,
          size: 36,
          font: "Calibri",
          color: ac,
        }),
      ],
    })
  );

  // Job title
  if (p.jobTitle) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: p.jobTitle, size: 22, font: "Calibri", color: "666666" }),
        ],
      })
    );
  }

  // Contact line
  const contactParts = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);
  if (contactParts.length > 0) {
    const runs: TextRun[] = [];
    contactParts.forEach((part, i) => {
      if (i > 0) runs.push(new TextRun({ text: "  •  ", size: 16, font: "Calibri", color: "999999" }));
      runs.push(new TextRun({ text: part, size: 16, font: "Calibri", color: "666666" }));
    });
    paragraphs.push(new Paragraph({ spacing: { after: 160 }, children: runs }));
  }

  /* ─── Summary ─── */
  if (vis.summary && p.summary) {
    paragraphs.push(sectionHeading("Professional Summary", accent));
    paragraphs.push(...richTextParagraphs(p.summary));
  }

  /* ─── Experience ─── */
  if (vis.experience && data.experience.length > 0) {
    paragraphs.push(sectionHeading("Experience", accent));
    for (const exp of data.experience) {
      // Position — Company                          Date range
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: exp.position, bold: true, size: 21, font: "Calibri" }),
            new TextRun({ text: exp.company ? `  ·  ${exp.company}` : "", size: 21, font: "Calibri", color: "666666" }),
            new TextRun({ text: "\t", size: 21, font: "Calibri" }),
            new TextRun({ text: dateRange(exp.startDate, exp.endDate, exp.current), size: 18, font: "Calibri", color: "888888" }),
          ],
        })
      );
      if (exp.location) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: exp.location, size: 18, font: "Calibri", color: "999999", italics: true })],
          })
        );
      }
      if (exp.description) {
        paragraphs.push(...richTextParagraphs(exp.description));
      }
      for (const h of exp.highlights.filter(Boolean)) {
        paragraphs.push(bullet(h));
      }
    }
  }

  /* ─── Education ─── */
  if (vis.education && data.education.length > 0) {
    paragraphs.push(sectionHeading("Education", accent));
    for (const edu of data.education) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`, bold: true, size: 21, font: "Calibri" }),
            new TextRun({ text: edu.institution ? `  ·  ${edu.institution}` : "", size: 21, font: "Calibri", color: "666666" }),
            new TextRun({ text: "\t", size: 21, font: "Calibri" }),
            new TextRun({ text: dateRange(edu.startDate, edu.endDate), size: 18, font: "Calibri", color: "888888" }),
          ],
        })
      );
      const subParts = [edu.gpa ? `GPA: ${edu.gpa}` : "", edu.description].filter(Boolean);
      if (subParts.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: subParts.join(" · "), size: 18, font: "Calibri", color: "666666" })],
          })
        );
      }
    }
  }

  /* ─── Skills ─── */
  if (vis.skills && data.skills.length > 0) {
    paragraphs.push(sectionHeading("Skills", accent));
    for (const sk of data.skills) {
      const runs: TextRun[] = [];
      if (sk.category) {
        runs.push(new TextRun({ text: `${sk.category}: `, bold: true, size: 20, font: "Calibri", color: "333333" }));
      }
      runs.push(new TextRun({ text: sk.items.join(", "), size: 20, font: "Calibri", color: "444444" }));
      paragraphs.push(new Paragraph({ spacing: { after: 40 }, children: runs }));
    }
  }

  /* ─── Projects ─── */
  if (vis.projects && data.projects.length > 0) {
    paragraphs.push(sectionHeading("Projects", accent));
    for (const proj of data.projects) {
      const titleRuns: TextRun[] = [
        new TextRun({ text: proj.name, bold: true, size: 21, font: "Calibri" }),
      ];
      if (proj.url) {
        titleRuns.push(new TextRun({ text: `  (${proj.url})`, size: 18, font: "Calibri", color: "888888" }));
      }
      paragraphs.push(new Paragraph({ spacing: { before: 100, after: 20 }, children: titleRuns }));
      if (proj.description) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: proj.description, size: 20, font: "Calibri", color: "444444" })],
          })
        );
      }
      if (proj.technologies.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: `Technologies: ${proj.technologies.join(", ")}`, size: 18, font: "Calibri", color: "666666", italics: true })],
          })
        );
      }
    }
  }

  /* ─── Certifications ─── */
  if (vis.certifications && data.certifications.length > 0) {
    paragraphs.push(sectionHeading("Certifications", accent));
    for (const c of data.certifications) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: c.name, bold: true, size: 20, font: "Calibri" }),
            new TextRun({ text: `  ·  ${c.issuer}`, size: 20, font: "Calibri", color: "666666" }),
            new TextRun({ text: "\t", size: 20, font: "Calibri" }),
            new TextRun({ text: fmtDate(c.date), size: 18, font: "Calibri", color: "888888" }),
          ],
        })
      );
    }
  }

  /* ─── Languages ─── */
  if (vis.languages && data.languages.length > 0) {
    paragraphs.push(sectionHeading("Languages", accent));
    const runs: TextRun[] = [];
    data.languages.forEach((l, i) => {
      if (i > 0) runs.push(new TextRun({ text: "  •  ", size: 20, font: "Calibri", color: "999999" }));
      runs.push(new TextRun({ text: l.name, size: 20, font: "Calibri" }));
      runs.push(new TextRun({ text: ` (${l.proficiency})`, size: 18, font: "Calibri", color: "888888" }));
    });
    paragraphs.push(new Paragraph({ spacing: { after: 60 }, children: runs }));
  }

  /* ─── Awards ─── */
  if (vis.awards && data.awards.length > 0) {
    paragraphs.push(sectionHeading("Awards", accent));
    for (const a of data.awards) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 20 },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: a.title, bold: true, size: 20, font: "Calibri" }),
            new TextRun({ text: `  ·  ${a.issuer}`, size: 20, font: "Calibri", color: "666666" }),
            new TextRun({ text: "\t", size: 20, font: "Calibri" }),
            new TextRun({ text: fmtDate(a.date), size: 18, font: "Calibri", color: "888888" }),
          ],
        })
      );
      if (a.description) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: a.description, size: 18, font: "Calibri", color: "666666" })],
          })
        );
      }
    }
  }

  /* ─── Build document ─── */
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch = 720 twips
            size: { width: 12240, height: 15840 }, // US Letter
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
