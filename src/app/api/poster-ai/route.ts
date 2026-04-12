import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, width = 1080, height = 1080 } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return Response.json(
        { error: "GOOGLE_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    // Use Gemini 2.0 Flash with image generation capability
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate image via Gemini
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a professional poster background image. The image should be ${width}x${height} pixels. Do not include any text, words, or letters in the image. Only visual elements like colors, patterns, textures, and graphics. Description: ${prompt}`,
            },
          ],
        },
      ],
    });

    const response = result.response;
    const content = response.candidates?.[0]?.content;

    if (!content?.parts || content.parts.length === 0) {
      return Response.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    const imagePart = content.parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart || !imagePart.inlineData) {
      return Response.json(
        { error: "No image data in response" },
        { status: 500 }
      );
    }

    // Return as base64 data URL
    const base64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (error) {
    console.error("Poster AI error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
