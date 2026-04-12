export function enhancePrompt(userPrompt: string): string {
  if (!userPrompt.trim()) return "";

  const quality =
    "high quality professional poster design, vibrant colors, visually striking, detailed, 4k";
  const style = "poster art, clean composition, no text, no words, no letters, no typography";

  return `${quality}, ${userPrompt.trim()}, ${style}`;
}
