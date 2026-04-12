"use client";

import { useState, useRef, useCallback } from "react";
import { Languages, ChevronDown } from "lucide-react";
import { transliterateToMalayalam } from "../lib/transliterate";

interface Props {
  onInsert: (text: string) => void;
}

export default function MalayalamInput({ onInsert }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (word: string) => {
    if (!word.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsLoading(true);
    const results = await transliterateToMalayalam(word);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setIsLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSelect = (suggestion: string) => {
    onInsert(suggestion);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-fuchsia-400 font-semibold">
        <Languages className="h-3.5 w-3.5" />
        Manglish → Malayalam
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          placeholder='Type in Manglish (e.g. "santhosham")'
          className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter" && suggestions.length > 0) {
              handleSelect(suggestions[0]);
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-fuchsia-500/40 border-t-fuchsia-500 animate-spin" />
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border/50 bg-card shadow-xl z-10 overflow-hidden">
            {suggestions.slice(0, 5).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-accent/10 transition-colors ${i === 0 ? "bg-fuchsia-500/10 text-fuchsia-300" : "text-foreground"}`}
              >
                <span className="font-medium">{s}</span>
                {i === 0 && (
                  <span className="text-[10px] text-muted">↵ Enter</span>
                )}
              </button>
            ))}
            <div className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-muted border-t border-border/30">
              <ChevronDown className="h-3 w-3" />
              Click to insert into selected text
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
