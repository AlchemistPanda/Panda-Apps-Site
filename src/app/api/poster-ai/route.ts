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

    // Use Gemini 2.0 Flash Preview Image Generation model
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-preview-image-generation" } as any);

    const imagePrompt = `Generate a professional poster background image ${width}x${height}. No text, no words, no letters, no typography anywhere in the image. Only visual elements: colors, patterns, textures, gradients, and decorative graphics. Description: ${prompt}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as any,
    });

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const imagePart = parts.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData) {
      return Response.json(
        { error: "No image in response. Try a different description." },
        { status: 500 }
      );
    }

    const base64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (error) {
    console.error("Poster AI error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
