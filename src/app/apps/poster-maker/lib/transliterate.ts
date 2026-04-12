// Google Input Tools API for Manglish -> Malayalam transliteration
// Free, no API key required. Returns Malayalam script suggestions.

export async function transliterateToMalayalam(word: string): Promise<string[]> {
  if (!word.trim()) return [];

  try {
    const url = `https://inputtools.google.com/request?itc=ml-t-i0-und&text=${encodeURIComponent(word)}&num=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    // Response shape: [status, [[word, [suggestion1, suggestion2, ...]]]]
    const suggestions: string[] = data?.[1]?.[0]?.[1] ?? [];
    return suggestions.length > 0 ? suggestions : [word];
  } catch {
    return [word];
  }
}

// Basic offline consonant/vowel fallback map for common syllables
// Used when the API is unavailable
export const MANGLISH_FALLBACK: Record<string, string> = {
  a: "അ", aa: "ആ", i: "ഇ", ii: "ഈ", u: "ഉ", uu: "ഊ",
  e: "എ", ee: "ഏ", o: "ഒ", oo: "ഓ",
  ka: "ക", kha: "ഖ", ga: "ഗ", gha: "ഘ",
  cha: "ച", ja: "ജ", jha: "ഝ",
  ta: "ത", da: "ദ", na: "ന",
  pa: "പ", pha: "ഫ", ba: "ബ", bha: "ഭ", ma: "മ",
  ya: "യ", ra: "ര", la: "ല", va: "വ",
  sa: "സ", sha: "ശ", ha: "ഹ",
};
