"use client";

export default function PandaCharacter() {
  return (
    <div className="relative flex items-center justify-center select-none" aria-hidden="true">
      <style>{`
        @keyframes panda-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          40%       { transform: translateY(-20px) rotate(1.2deg); }
          70%       { transform: translateY(-10px) rotate(-0.6deg); }
        }
        @keyframes panda-wave {
          0%, 100% { transform: rotate(-15deg); }
          35%       { transform: rotate(28deg); }
          65%       { transform: rotate(-8deg); }
        }
        @keyframes panda-blink {
          0%, 88%, 100%   { transform: scaleY(1); }
          92%, 96%         { transform: scaleY(0.06); }
        }
        @keyframes panda-glow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.15); }
        }
        @keyframes panda-orbit {
          from { transform: rotate(0deg) translateX(115px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(115px) rotate(-360deg); }
        }
        @keyframes spark-pop {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          35%, 65%  { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50%       { opacity: 0.25; transform: scale(1.08); }
        }

        .p-float    { animation: panda-float 4.8s ease-in-out infinite; }
        .p-blink-l  { animation: panda-blink 4.2s ease-in-out infinite;
                      transform-box: fill-box; transform-origin: center; }
        .p-blink-r  { animation: panda-blink 4.2s ease-in-out infinite 0.06s;
                      transform-box: fill-box; transform-origin: center; }
        .p-glow     { animation: panda-glow 3.2s ease-in-out infinite; }
        .p-ring     { animation: ring-pulse 3.2s ease-in-out infinite; }
        .p-ring2    { animation: ring-pulse 3.2s ease-in-out infinite 1.6s; }
        .p-spark1   { animation: spark-pop 2.4s ease-in-out infinite; }
        .p-spark2   { animation: spark-pop 2.4s ease-in-out infinite 0.9s; }
        .p-spark3   { animation: spark-pop 2.4s ease-in-out infinite 1.7s; }
        .p-orbit    { animation: panda-orbit 12s linear infinite; }

        /* Arm wave — arm group translated so local origin = shoulder */
        .p-wave { animation: panda-wave 1.3s ease-in-out infinite;
                  transform-box: fill-box; transform-origin: 50% 0%; }
      `}</style>

      {/* Outer glow rings */}
      <div className="p-ring  absolute inset-0 rounded-full border border-accent/20" />
      <div className="p-ring2 absolute inset-6 rounded-full border border-accent/10" />

      {/* Green glow blob */}
      <div className="p-glow absolute inset-8 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      {/* Orbiting dot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="p-orbit">
          <div className="h-2 w-2 rounded-full bg-accent shadow-lg shadow-accent/60" />
        </div>
      </div>

      {/* Sparkle stars */}
      <svg className="p-spark1 absolute top-3 right-10 text-accent" width="18" height="18" viewBox="0 0 20 20">
        <path d="M10 0L11.8 8.2L20 10L11.8 11.8L10 20L8.2 11.8L0 10L8.2 8.2Z" fill="currentColor"/>
      </svg>
      <svg className="p-spark2 absolute top-12 -left-2 text-accent/80" width="13" height="13" viewBox="0 0 20 20">
        <path d="M10 0L11.8 8.2L20 10L11.8 11.8L10 20L8.2 11.8L0 10L8.2 8.2Z" fill="currentColor"/>
      </svg>
      <svg className="p-spark3 absolute bottom-14 right-0 text-accent/60" width="10" height="10" viewBox="0 0 20 20">
        <path d="M10 0L11.8 8.2L20 10L11.8 11.8L10 20L8.2 11.8L0 10L8.2 8.2Z" fill="currentColor"/>
      </svg>

      {/* ── Panda SVG ── */}
      <div className="p-float relative z-10">
        <svg
          width="270"
          height="290"
          viewBox="0 0 220 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="headSheen" cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#cccccc" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="bodySheen" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#bbbbbb" stopOpacity="0.2" />
            </radialGradient>
            <filter id="pandaDrop">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#22c55e" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Ground shadow */}
          <ellipse cx="110" cy="246" rx="58" ry="8" fill="black" opacity="0.14" />

          {/* ── Right arm (resting) ── */}
          <g transform="translate(158, 152)">
            <ellipse cx="0" cy="26" rx="16" ry="28" fill="white" transform="rotate(18)" />
            <ellipse cx="0" cy="26" rx="16" ry="28" fill="url(#bodySheen)" transform="rotate(18)" />
            <circle cx="18" cy="46" r="10" fill="#1c1c1c" />
          </g>

          {/* ── Body ── */}
          <ellipse cx="110" cy="185" rx="55" ry="60" fill="white" filter="url(#pandaDrop)" />
          <ellipse cx="110" cy="185" rx="55" ry="60" fill="url(#bodySheen)" />
          {/* Belly patch */}
          <ellipse cx="110" cy="196" rx="30" ry="34" fill="#ededeb" opacity="0.65" />

          {/* ── Left arm (waving) — shoulder at (62, 148) ── */}
          <g transform="translate(62, 148)">
            <g className="p-wave">
              <ellipse cx="0" cy="30" rx="16" ry="28" fill="white" />
              <ellipse cx="0" cy="30" rx="16" ry="28" fill="url(#bodySheen)" />
              <circle cx="-8" cy="54" r="10" fill="#1c1c1c" />
            </g>
          </g>

          {/* ── Ears ── */}
          <circle cx="60"  cy="40" r="23" fill="#1e1e1e" />
          <circle cx="160" cy="40" r="23" fill="#1e1e1e" />
          <circle cx="60"  cy="40" r="13" fill="#2e2e2e" />
          <circle cx="160" cy="40" r="13" fill="#2e2e2e" />

          {/* ── Head ── */}
          <circle cx="110" cy="90" r="58" fill="white" filter="url(#pandaDrop)" />
          <circle cx="110" cy="90" r="58" fill="url(#headSheen)" />

          {/* ── Eye patches ── */}
          <ellipse cx="86"  cy="88" rx="21" ry="18" fill="#1e1e1e" transform="rotate(-12, 86, 88)" />
          <ellipse cx="134" cy="88" rx="21" ry="18" fill="#1e1e1e" transform="rotate(12, 134, 88)" />

          {/* ── Eyes (blink groups) ── */}
          <g className="p-blink-l">
            <circle cx="86"  cy="88" r="9.5" fill="white" />
            <circle cx="88"  cy="90" r="5.5" fill="#0a0a0a" />
            <circle cx="90"  cy="86" r="2"   fill="white" />
          </g>
          <g className="p-blink-r">
            <circle cx="134" cy="88" r="9.5" fill="white" />
            <circle cx="136" cy="90" r="5.5" fill="#0a0a0a" />
            <circle cx="138" cy="86" r="2"   fill="white" />
          </g>

          {/* ── Nose ── */}
          <ellipse cx="110" cy="106" rx="7" ry="5" fill="#1e1e1e" />

          {/* ── Smile ── */}
          <path
            d="M 97 116 Q 110 128 123 116"
            stroke="#1e1e1e"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── Cheek blush ── */}
          <circle cx="70"  cy="103" r="9" fill="#ffb3b3" opacity="0.32" />
          <circle cx="150" cy="103" r="9" fill="#ffb3b3" opacity="0.32" />

          {/* ── Legs ── */}
          <ellipse cx="87"  cy="236" rx="24" ry="13" fill="#1e1e1e" />
          <ellipse cx="133" cy="236" rx="24" ry="13" fill="#1e1e1e" />

          {/* ── Accent green patch on ear (brand touch) ── */}
          <circle cx="160" cy="40" r="5" fill="#22c55e" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
