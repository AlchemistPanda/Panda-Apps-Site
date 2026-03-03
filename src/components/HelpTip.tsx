"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

type Props = {
  /** Short label like "g", "i", "Global" — shown in tooltip header */
  label?: string;
  /** Full explanation text */
  tip: string;
  /** Optional extra content (examples, notes) */
  extra?: React.ReactNode;
  /** Size of trigger icon in px — default 12 */
  size?: number;
  /** Side for the popover — default "top" */
  side?: "top" | "bottom" | "left" | "right";
};

/**
 * Inline help icon that shows a tooltip/popover explaining an option.
 * Works in any app — just drop <HelpTip tip="..." /> next to any option.
 */
export default function HelpTip({ label, tip, extra, size = 12, side = "top" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const posClass = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side];

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Help"
        className="text-muted/50 hover:text-muted transition-colors align-middle"
        style={{ lineHeight: 0 }}
      >
        <HelpCircle style={{ width: size, height: size }} />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-56 rounded-xl border border-border/60 bg-popover shadow-xl p-3 ${posClass}`}
          style={{ backdropFilter: "blur(8px)" }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {label && (
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">{label}</p>
          )}
          <p className="text-xs text-foreground/90 leading-relaxed">{tip}</p>
          {extra && <div className="mt-2 pt-2 border-t border-border/40">{extra}</div>}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-popover border-border/60 rotate-45 ${
            side === "top"    ? "top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r" :
            side === "bottom" ? "bottom-full left-1/2 -translate-x-1/2 mb-[-4px] border-t border-l" :
            side === "left"   ? "left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r" :
                                "right-full top-1/2 -translate-y-1/2 mr-[-4px] border-b border-l"
          }`} />
        </div>
      )}
    </div>
  );
}
