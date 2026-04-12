export function enhancePrompt(userPrompt: string): string {
  if (!userPrompt.trim()) return "";

  const quality =
    "high quality professional poster design, vibrant colors, visually striking, detailed, 4k";
  const style = "poster art, clean composition, no text, no words, no letters";

  return `${quality}, ${userPrompt.trim()}, ${style}`;
}

export function buildPollinationsUrl(
  prompt: string,
  width: number,
  height: number,
  seed?: number
): string {
  const encoded = encodeURIComponent(prompt);
  const s = seed ?? Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${s}`;
}
