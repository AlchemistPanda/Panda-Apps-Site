import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { fileData, fileName } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return Response.json({ error: "GOOGLE_API_KEY not configured" }, { status: 500 });
    }
    if (!fileData) {
      return Response.json({ error: "No file data provided" }, { status: 400 });
    }

    const modelsToTry = [
      "gemini-3-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3-pro", // Pro as fallback
    ];

    let lastError: Error | null = null;
    let responseText = "";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `You are an expert document converter. Analyze this PDF document and extract ALL content with precise formatting and structure information.

RULES:
1. Preserve the reading order of the document exactly.
2. Detect headings based on font size, boldness, and visual hierarchy.
3. Detect tables and preserve their row/column structure.
4. Detect bullet lists and numbered lists.
5. Detect the primary language of the document.
6. For each text element, note if it's bold, italic, or has special formatting.
7. Group related text into paragraphs (don't split sentences).
8. If the PDF is scanned/image-based, use OCR to extract all text.
9. Support ALL languages including Malayalam, Hindi, Tamil, Arabic, CJK, etc.

Return ONLY valid JSON with this exact structure:
{
  "language": "detected ISO language code (e.g. en, ml, hi, ar)",
  "pages": [
    {
      "pageNumber": 1,
      "elements": [
        {
          "type": "heading",
          "level": 1,
          "content": "Heading Text",
          "style": { "bold": true, "italic": false, "fontSize": 24, "alignment": "left" }
        },
        {
          "type": "paragraph",
          "content": "Paragraph text content here...",
          "style": { "bold": false, "italic": false, "fontSize": 12, "alignment": "left" }
        },
        {
          "type": "table",
          "tableData": {
            "rows": [["Header 1", "Header 2"], ["Cell 1", "Cell 2"]],
            "headerRow": true
          }
        },
        {
          "type": "list",
          "listItems": ["Item 1", "Item 2", "Item 3"],
          "listType": "bullet"
        }
      ]
    }
  ]
}

IMPORTANT: type must be one of: "heading", "paragraph", "table", "list"
For tables, rows is an array of arrays of strings.
Extract EVERY piece of text — do not skip any content.`;

        const content = [
          { inlineData: { mimeType: "application/pdf", data: fileData } },
          { text: prompt },
        ];

        const result = await model.generateContent(content);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`, err);
        lastError = err as Error;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All AI models failed to process the PDF.");
    }

    let parsed;
    try {
      // Remove potential markdown code blocks if the AI includes them
      const cleanedJson = responseText.replace(/```json\n?|```/g, "").trim();
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("AI JSON parse error. Raw response:", responseText);
      throw new Error("AI returned an invalid response format. Please try again.");
    }

    // Normalize table rows: convert string[][] to {text: string}[][]
    if (parsed.pages) {
      for (const page of parsed.pages) {
        if (page.elements) {
          for (const el of page.elements) {
            if (el.type === "table" && el.tableData?.rows) {
              el.tableData.rows = el.tableData.rows.map((row: (string | { text: string })[]) =>
                row.map((cell: string | { text: string }) =>
                  typeof cell === "string" ? { text: cell } : cell
                )
              );
            }
          }
        }
      }
    }

    return Response.json(parsed);
  } catch (error) {
    console.error("PDF Convert error:", error);
    const msg = error instanceof Error ? error.message : "Conversion failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
