import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { fileData, fileName, fileType } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return Response.json({ error: "GOOGLE_API_KEY not configured" }, { status: 500 });
    }

    if (!fileData) {
      return Response.json({ error: "No file data provided" }, { status: 400 });
    }

    // List of models to try in order of preference (2026 latest models first)
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
    ];

    let lastError: Error | null = null;
    let responseText = "";

    // Determine correct MIME type for the uploaded file
    const mimeTypeMap: Record<string, string> = {
      "application/pdf": "application/pdf",
      "application/msword": "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const resolvedMimeType = mimeTypeMap[fileType] || "application/pdf";

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          }
        });

        const prompt = `
          You are an expert resume parser. Extract information from the attached resume file and format it as JSON.
          
          RULES:
          1. If a field is not found, use an empty string "" or an empty array [].
          2. Dates should be in YYYY-MM or YYYY format if possible.
          3. For multi-line descriptions, use \\n for new lines.
          4. Ensure all IDs are unique strings (e.g. "exp1", "edu1").
          5. "current" field in experience/volunteer should be true if the end date is "Present" or empty.
          
          JSON SCHEMA:
          {
            "personal": {
              "fullName": "string",
              "jobTitle": "string",
              "email": "string",
              "phone": "string",
              "location": "string",
              "website": "string",
              "linkedin": "string",
              "github": "string",
              "summary": "string"
            },
            "experience": [
              { "id": "string", "company": "string", "position": "string", "location": "string", "startDate": "string", "endDate": "string", "current": "boolean", "description": "string", "highlights": ["string"] }
            ],
            "education": [
              { "id": "string", "institution": "string", "degree": "string", "field": "string", "location": "string", "startDate": "string", "endDate": "string", "gpa": "string", "description": "string" }
            ],
            "skills": [
              { "id": "string", "category": "string", "items": ["string"] }
            ],
            "projects": [
              { "id": "string", "name": "string", "description": "string", "technologies": ["string"], "url": "string", "startDate": "string", "endDate": "string" }
            ],
            "certifications": [
              { "id": "string", "name": "string", "issuer": "string", "date": "string", "url": "string" }
            ],
            "languages": [
              { "id": "string", "name": "string", "proficiency": "string" }
            ],
            "awards": [
              { "id": "string", "title": "string", "issuer": "string", "date": "string", "description": "string" }
            ],
            "volunteer": [
              { "id": "string", "organization": "string", "role": "string", "location": "string", "startDate": "string", "endDate": "string", "current": "boolean", "description": "string" }
            ],
            "interests": ["string"],
            "references": [],
            "referencesNote": "string"
          }
        `;

        const content = [
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: fileData,     
            },
          },
          { text: prompt },
        ];

        const result = await model.generateContent(content);
        responseText = result.response.text();
        
        if (responseText) break; // Success!
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`, err);
        lastError = err as Error;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All available AI models failed to process the resume.");
    }
    
    try {
      const parsedData = JSON.parse(responseText);
      return Response.json(parsedData);
    } catch (parseErr) {
      console.error("JSON parse error:", responseText);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }

  } catch (error) {
    console.error("Resume Parser error:", error);
    const msg = error instanceof Error ? error.message : "Parsing failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
