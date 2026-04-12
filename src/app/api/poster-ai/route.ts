import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, width = 1080, height = 1080 } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return Response.json({ error: "GOOGLE_API_KEY not configured" }, { status: 500 });
    }
    if (!prompt?.trim()) {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    // Determine aspect ratio for the prompt guidance
    const ratio = width >= height
      ? `${width}x${height} landscape`
      : width === height
      ? "1:1 square"
      : `${width}x${height} portrait`;

    const imagePrompt = `Create a professional poster background image in ${ratio} format. No text, no words, no letters, no numbers, no typography anywhere. Only visual elements: colors, patterns, textures, gradients, decorative shapes and graphics. Description: ${prompt.trim()}`;

    // gemini-2.5-flash-image supports image output via responseModalities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" } as any);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as any,
    });

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart?.inlineData) {
      return Response.json({ error: "No image returned. Try a different description." }, { status: 500 });
    }

    const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    return Response.json({ imageUrl: dataUrl });

  } catch (error) {
    console.error("Poster AI error:", error);
    const msg = error instanceof Error ? error.message : "Generation failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
