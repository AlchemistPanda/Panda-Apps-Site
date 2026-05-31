import React from 'react';

interface PandaLogoProps {
  width?: number;
  height?: number;
  isHappy?: boolean;
  className?: string;
}

export const PandaLogo: React.FC<PandaLogoProps> = ({
  width = 120,
  height = 120,
  isHappy = true,
  className = '',
}) => {
  return (
    <div
      className={`panda-container ${className}`}
      style={{
        width,
        height,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          .panda-ear {
            transform-origin: 50px 50px;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .panda-ear-right {
            transform-origin: 150px 50px;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .panda-container:hover .panda-ear {
            transform: rotate(-8deg);
          }
          .panda-container:hover .panda-ear-right {
            transform: rotate(8deg);
          }
          
          .panda-eye-pupil {
            animation: blink 5s infinite;
            transform-origin: 100px 95px;
          }
          
          @keyframes blink {
            0%, 96%, 100% {
              transform: scaleY(1);
            }
            98% {
              transform: scaleY(0.1);
            }
          }
          
          .panda-blush {
            animation: glow 3s ease-in-out infinite alternate;
          }
          @keyframes glow {
            0% { opacity: 0.35; }
            100% { opacity: 0.6; }
          }
        `}</style>

        {/* Ears */}
        <circle className="panda-ear" cx="50" cy="50" r="28" fill="#1b212f" stroke="#080a0f" strokeWidth="3" />
        <circle className="panda-ear-right" cx="150" cy="50" r="28" fill="#1b212f" stroke="#080a0f" strokeWidth="3" />
        
        {/* Ear Inner details */}
        <circle className="panda-ear" cx="50" cy="50" r="16" fill="#121620" />
        <circle className="panda-ear-right" cx="150" cy="50" r="16" fill="#121620" />

        {/* Face Base */}
        <circle cx="100" cy="110" r="76" fill="#ffffff" stroke="#121620" strokeWidth="4" />

        {/* Eyes Patches (droplet shape tilted outwards) */}
        <g transform="translate(68, 102) rotate(-16)">
          <ellipse cx="0" cy="0" rx="20" ry="26" fill="#1b212f" />
        </g>
        <g transform="translate(132, 102) rotate(16)">
          <ellipse cx="0" cy="0" rx="20" ry="26" fill="#1b212f" />
        </g>

        {/* Blush Cheeks */}
        <circle className="panda-blush" cx="50" cy="132" r="10" fill="#ff7da7" opacity="0.4" filter="blur(1px)" />
        <circle className="panda-blush" cx="150" cy="132" r="10" fill="#ff7da7" opacity="0.4" filter="blur(1px)" />

        {/* Eye Whites & Pupils (Blinking animation) */}
        <g className="panda-eye-pupil">
          <circle cx="70" cy="98" r="7" fill="#ffffff" />
          <circle cx="130" cy="98" r="7" fill="#ffffff" />
          
          <circle cx="70" cy="98" r="4.5" fill="#080a0f" />
          <circle cx="130" cy="98" r="4.5" fill="#080a0f" />
          
          {/* Eye Shine Highlights */}
          <circle cx="72" cy="96" r="2" fill="#ffffff" />
          <circle cx="132" cy="96" r="2" fill="#ffffff" />
        </g>

        {/* Nose */}
        <path d="M94 116C94 114 96 112 100 112C104 112 106 114 106 116C106 118 102 122 100 122C98 122 94 118 94 116Z" fill="#1b212f" />

        {/* Smiling Mouth */}
        {isHappy ? (
          /* Sweet open smiling mouth with pink tongue */
          <g>
            <path
              d="M86 126C88 132 94 135 100 135C106 135 112 132 114 126"
              stroke="#1b212f"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M90 127C90 127 94 146 100 146C106 146 110 127 110 127C110 127 107 132 100 132C93 132 90 127 90 127Z"
              fill="#ff4b81"
            />
            <path
              d="M92 126C95 129 98 128 100 128C102 128 105 129 108 126"
              stroke="#1b212f"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        ) : (
          /* Simple small happy line */
          <path
            d="M90 128C93 131 97 132 100 132C103 132 107 131 110 128"
            stroke="#1b212f"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
