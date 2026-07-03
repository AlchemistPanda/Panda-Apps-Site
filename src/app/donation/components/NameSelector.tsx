'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface NameSelectorProps {
  names: string[];
  selectedName: string;
  onChange: (name: string) => void;
  placeholder?: string;
}

export default function NameSelector({
  names,
  selectedName,
  onChange,
  placeholder = "Search or select your name..."
}: NameSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNames = names.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="don-input w-full flex items-center justify-between text-left cursor-pointer bg-white"
      >
        <span className={selectedName ? "text-[#2d3436] font-medium" : "text-[#7f8c8d]"}>
          {selectedName || placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-[#7f8c8d] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-[#f0e6df] rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f0e6df] bg-[#faf6f0]">
            <Search className="w-4 h-4 text-[#7f8c8d]" />
            <input
              type="text"
              placeholder="Type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-[#2d3436] placeholder-[#7f8c8d]"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-[#fcf9f6]">
            {filteredNames.length > 0 ? (
              filteredNames.map((name) => {
                const isSelected = selectedName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#fbebe4] text-[#e8734a] font-semibold"
                        : "hover:bg-[#faf6f0] text-[#2d3436]"
                    }`}
                  >
                    <span>{name}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#e8734a]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-sm text-center text-[#7f8c8d]">
                No names found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
