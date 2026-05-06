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

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert resume parser. Extract information from the attached resume file and format it EXACTLY as the JSON structure below.
      
      RULES:
      1. If a field is not found, use an empty string "" or an empty array [].
      2. Dates should be in YYYY-MM or YYYY format if possible.
      3. For multi-line descriptions, use \\n for new lines.
      4. Ensure all IDs are unique strings (you can generate them like "exp1", "edu1", etc.).
      5. The output MUST be valid JSON.
      6. "current" field in experience/volunteer should be true if the end date is "Present" or empty.
      
      JSON STRUCTURE:
      {
        "personal": {
          "fullName": "",
          "jobTitle": "",
          "email": "",
          "phone": "",
          "location": "",
          "website": "",
          "linkedin": "",
          "github": "",
          "summary": ""
        },
        "experience": [
          {
            "id": "exp1",
            "company": "",
            "position": "",
            "location": "",
            "startDate": "",
            "endDate": "",
            "current": false,
            "description": "",
            "highlights": [""]
          }
        ],
        "education": [
          {
            "id": "edu1",
            "institution": "",
            "degree": "",
            "field": "",
            "location": "",
            "startDate": "",
            "endDate": "",
            "gpa": "",
            "description": ""
          }
        ],
        "skills": [
          { "id": "sk1", "category": "", "items": [""] }
        ],
        "projects": [
          { "id": "proj1", "name": "", "description": "", "technologies": [""], "url": "", "startDate": "", "endDate": "" }
        ],
        "certifications": [
          { "id": "cert1", "name": "", "issuer": "", "date": "", "url": "" }
        ],
        "languages": [
          { "id": "lang1", "name": "", "proficiency": "Intermediate" }
        ],
        "awards": [
          { "id": "aw1", "title": "", "issuer": "", "date": "", "description": "" }
        ],
        "volunteer": [
          { "id": "vol1", "organization": "", "role": "", "location": "", "startDate": "", "endDate": "", "current": false, "description": "" }
        ],
        "interests": [""],
        "references": [],
        "referencesNote": "Available upon request"
      }
    `;

    // Prepare content for Gemini
    const content = [
      {
        inlineData: {
          mimeType: fileType, // e.g. "application/pdf"
          data: fileData,     // base64 data
        },
      },
      { text: prompt },
    ];

    const result = await model.generateContent(content);
    const responseText = result.response.text();
    
    // Extract JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    return Response.json(parsedData);

  } catch (error) {
    console.error("Resume Parser error:", error);
    const msg = error instanceof Error ? error.message : "Parsing failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
