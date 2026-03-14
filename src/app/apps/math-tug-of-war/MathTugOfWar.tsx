'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Volume2, VolumeX, Settings, X, Pause, Play, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import Link from 'next/link';

/* ─────────────────────────────────────────────
   Constants & Types
   ───────────────────────────────────────────── */
const MAX_LEVEL = 10;
const DEFAULT_TIMER = 10;
const DEFAULT_PULLS = 5;

type Operator = '+' | '-' | '×';
type Problem = { num1: number; num2: number; op: Operator; answer: number };
type Team = 'A' | 'B' | null;

const LEVEL_LABELS: Record<number, string> = {
  1: '1-Digit Addition',
  2: '1-Digit Add & Sub',
  3: '1-Digit Subtraction',
  4: '2-Digit Addition',
  5: '2-Digit Add & Sub',
  6: '2-Digit Subtraction',
  7: '1-Digit Multiply',
  8: '2-Digit + 1-Digit Multiply',
  9: '2-Digit Mixed All',
  10: 'Grand Finale Mix',
};

/* ─────────────────────────────────────────────
   Problem Generation
   ───────────────────────────────────────────── */
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateProblem = (level: number): Problem => {
  let num1 = 0, num2 = 0, op: Operator = '+';
  switch (level) {
    case 1: num1 = rand(1,9); num2 = rand(1,9); op = '+'; break;
    case 2: op = Math.random()>0.5?'+':'-'; num1 = rand(2,9); num2 = op==='-'?rand(1,num1):rand(1,9); break;
    case 3: op = '-'; num1 = rand(2,9); num2 = rand(1,num1); break;
    case 4: num1 = rand(10,50); num2 = rand(10,50); op = '+'; break;
    case 5: op = Math.random()>0.5?'+':'-'; num1 = rand(15,99); num2 = op==='-'?rand(10,num1):rand(10,50); break;
    case 6: op = '-'; num1 = rand(20,99); num2 = rand(10,num1); break;
    case 7: op = '×'; num1 = rand(2,9); num2 = rand(2,9); break;
    case 8: op = '×'; num1 = rand(2,9); num2 = rand(10,15); break;
    case 9: { const ops: Operator[] = ['+','-','×']; op = ops[rand(0,2)];
      if (op==='×'){num1=rand(2,9);num2=rand(2,9)} else if(op==='-'){num1=rand(10,50);num2=rand(1,num1)} else{num1=rand(10,50);num2=rand(10,50)} break; }
    case 10: default: { const ops: Operator[] = ['+','-','×']; op = ops[rand(0,2)];
      if(op==='×'){num1=rand(2,12);num2=rand(2,12)} else if(op==='-'){num1=rand(20,99);num2=rand(1,num1)} else{num1=rand(10,99);num2=rand(10,99)} break; }
  }
  let answer = 0;
  if (op==='+') answer=num1+num2; if (op==='-') answer=num1-num2; if (op==='×') answer=num1*num2;
  return { num1, num2, op, answer };
};

/* ─────────────────────────────────────────────
   Sound Engine (Web Audio API)
   ───────────────────────────────────────────── */
let audioCtxSingleton: AudioContext | null = null;
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtxSingleton) { try { audioCtxSingleton = new AudioContext(); } catch {} }
  return audioCtxSingleton;
};

const playTone = (freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) => {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.value = vol; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
};

const sfx = {
  correct: () => { playTone(523,0.1,'sine',0.15); setTimeout(()=>playTone(659,0.1,'sine',0.15),100); setTimeout(()=>playTone(784,0.18,'sine',0.18),200); },
  wrong: () => { playTone(150,0.15,'sawtooth',0.08); setTimeout(()=>playTone(120,0.2,'sawtooth',0.06),150); },
  click: () => { playTone(1200,0.04,'sine',0.06); },
  delete: () => { playTone(400,0.06,'triangle',0.05); },
  win: () => { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>playTone(f,0.25,'sine',0.14),i*120)); },
  levelUp: () => { [440,554,659,880].forEach((f,i)=>setTimeout(()=>playTone(f,0.15,'triangle',0.1),i*100)); },
  countdown: () => { playTone(880,0.1,'sine',0.1); },
  countdownGo: () => { playTone(1047,0.3,'sine',0.18); },
  timerWarn: () => { playTone(600,0.08,'square',0.05); },
  timeout: () => { playTone(200,0.3,'sawtooth',0.1); setTimeout(()=>playTone(150,0.4,'sawtooth',0.08),200); },
};

/* ─────────────────────────────────────────────
   Background Music Engine
   ───────────────────────────────────────────── */
class BGMusic {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;

  start() {
    if (this.running) return;
    try {
      this.ctx = getAudioCtx(); if (!this.ctx) return;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.04;
      this.gainNode.connect(this.ctx.destination);
      this.running = true;

      // A simple looping melody
      const melody = [
        262, 294, 330, 349, 392, 349, 330, 294,
        262, 330, 392, 523, 392, 330, 294, 262,
        349, 392, 440, 392, 349, 330, 294, 330,
        262, 294, 330, 392, 440, 392, 330, 262,
      ];
      let i = 0;
      const playNote = () => {
        if (!this.running || !this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = melody[i % melody.length];
        osc.connect(this.gainNode);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
        i++;
      };
      playNote();
      this.intervalId = setInterval(playNote, 300);
    } catch {}
  }

  stop() {
    this.running = false;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  setVolume(v: number) {
    if (this.gainNode) this.gainNode.gain.value = v;
  }
}

// bgMusic instance managed per-component via useRef (see main component)

/* ─────────────────────────────────────────────
   SVG Character Component – arms reach to rope
   ───────────────────────────────────────────── */
const CartoonCharacter = ({ isGirl, teamColor, index, pulling, facingLeft, isFirst }: {
  isGirl: boolean; teamColor: string; index: number; pulling: boolean; facingLeft: boolean; isFirst: boolean;
}) => {
  const skinTones = ['#FFDBB4','#F1C27D','#E0AC69','#C68642','#8D5524'];
  const skin = skinTones[index % skinTones.length];
  const hairColors = isGirl ? ['#2C1810','#8B4513','#DAA520','#800020','#1a1a2e'] : ['#1a1a2e','#2C1810','#8B4513','#4a2800','#333'];
  const hair = hairColors[index % hairColors.length];

  // The SVG is designed so the front character's hands reach the edge of the viewbox
  // where the rope connects. The rope extends from the edge of the character group.
  return (
    <svg viewBox="0 0 90 130" className="w-[48px] h-[72px] sm:w-[65px] sm:h-[98px] md:w-[78px] md:h-[117px]"
         style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}>
      
      {/* Legs */}
      <g className={pulling ? 'animate-[pullLegs_0.4s_ease-in-out_infinite_alternate]' : ''}>
        <rect x="30" y="92" width="9" height="22" rx="4.5" fill={teamColor} opacity="0.85"/>
        <rect x="46" y="92" width="9" height="22" rx="4.5" fill={teamColor} opacity="0.85"/>
        <ellipse cx="34" cy="114" rx="8" ry="4.5" fill="#444"/>
        <ellipse cx="51" cy="114" rx="8" ry="4.5" fill="#444"/>
      </g>

      {/* Body */}
      <rect x="24" y="56" width="37" height="40" rx="10" fill={teamColor}/>
      {/* Shirt stripe */}
      <rect x="36" y="60" width="13" height="3" rx="1.5" fill="white" opacity="0.3"/>
      {isGirl && <rect x="24" y="90" width="37" height="6" rx="3" fill={teamColor} opacity="0.7"/>}

      {/* Arms reaching forward to hold rope — extend to edge */}
      <g className={pulling ? 'animate-[pullArms_0.3s_ease-in-out_infinite_alternate]' : ''}>
        {/* Front arm — reaches far right to rope connection point */}
        <path d={`M58,62 Q70,58 ${isFirst ? '88' : '80'},62`} stroke={skin} strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Hand gripping */}
        <circle cx={isFirst ? 88 : 80} cy="62" r="5" fill={skin}/>
        {/* Black grip marks */}
        <circle cx={isFirst ? 88 : 80} cy="62" r="5" fill="none" stroke="#8B4513" strokeWidth="2" opacity="0.5"/>
        
        {/* Back arm — also reaching, slightly lower */}
        <path d={`M58,68 Q68,65 ${isFirst ? '86' : '78'},66`} stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.85"/>
        <circle cx={isFirst ? 86 : 78} cy="66" r="4.5" fill={skin} opacity="0.85"/>
      </g>

      {/* Head */}
      <g className={pulling ? '' : 'animate-[idleBob_2s_ease-in-out_infinite]'}>
        <circle cx="42" cy="36" r="20" fill={skin}/>
        
        {/* Hair */}
        {isGirl ? (
          <>
            <ellipse cx="42" cy="24" rx="22" ry="14" fill={hair}/>
            <rect x="18" y="24" width="7" height="28" rx="3.5" fill={hair}/>
            <rect x="60" y="24" width="7" height="28" rx="3.5" fill={hair}/>
            <g transform="translate(60,20)">
              <circle cx="0" cy="0" r="5" fill="#FF69B4"/>
              <circle cx="5" cy="-3" r="3" fill="#FF1493"/>
              <circle cx="-3" cy="-4" r="3" fill="#FF1493"/>
            </g>
          </>
        ) : (
          <>
            <ellipse cx="42" cy="22" rx="20" ry="12" fill={hair}/>
            <rect x="24" y="16" width="36" height="7" rx="3.5" fill={hair}/>
            <polygon points="30,16 34,7 38,16" fill={hair}/>
            <polygon points="38,15 42,5 46,15" fill={hair}/>
            <polygon points="46,16 50,7 54,16" fill={hair}/>
          </>
        )}

        {/* Eyes */}
        <g className="animate-[blink_4s_ease-in-out_infinite]">
          <ellipse cx="35" cy="36" rx="3.5" ry="4" fill="white"/>
          <ellipse cx="49" cy="36" rx="3.5" ry="4" fill="white"/>
          <circle cx="36" cy="36" r="2" fill="#1a1a2e"/>
          <circle cx="50" cy="36" r="2" fill="#1a1a2e"/>
          <circle cx="37" cy="35" r="0.8" fill="white"/>
          <circle cx="51" cy="35" r="0.8" fill="white"/>
        </g>

        {/* Mouth */}
        {pulling ? (
          <path d="M36,44 Q42,50 48,44" stroke="#c0392b" strokeWidth="2" fill="none"/>
        ) : (
          <path d="M37,44 Q42,48 47,44" stroke="#e74c3c" strokeWidth="1.5" fill="none"/>
        )}

        {/* Cheeks */}
        <circle cx="28" cy="41" r="4" fill="#FF6B6B" opacity="0.2"/>
        <circle cx="56" cy="41" r="4" fill="#FF6B6B" opacity="0.2"/>
      </g>
    </svg>
  );
};

/* ─────────────────────────────────────────────
   Confetti
   ───────────────────────────────────────────── */
const Confetti = () => {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i, left: Math.random()*100, delay: Math.random()*2.5,
    color: ['#FF6B6B','#4ECDC4','#FFE66D','#A8E6CF','#FF8B94','#FFDAA5','#B8F2E6','#FF69B4','#7C4DFF','#00E5FF'][i%10],
    size: 5+Math.random()*10, duration: 2+Math.random()*3,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute animate-[confettiFall_linear_forwards]" style={{
          left:`${p.left}%`, top:'-20px', width:p.size, height:p.size,
          backgroundColor:p.color, borderRadius: Math.random()>0.5?'50%':'2px',
          animationDelay:`${p.delay}s`, animationDuration:`${p.duration}s`,
          transform:`rotate(${Math.random()*360}deg)`,
        }}/>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Floating Cloud
   ───────────────────────────────────────────── */
const Cloud = ({ top, left, size }: { top: string; left: string; size: number }) => (
  <div className="absolute pointer-events-none opacity-30 animate-[cloudFloat_40s_linear_infinite]" style={{ top, left }}>
    <svg width={size} height={size*0.5} viewBox="0 0 200 100">
      <ellipse cx="100" cy="65" rx="90" ry="30" fill="white"/>
      <circle cx="60" cy="50" r="35" fill="white"/>
      <circle cx="100" cy="40" r="40" fill="white"/>
      <circle cx="140" cy="50" r="30" fill="white"/>
    </svg>
  </div>
);

/* ─────────────────────────────────────────────
   Timer Circle Component
   ───────────────────────────────────────────── */
const TimerCircle = ({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) => {
  const pct = timeLeft / maxTime;
  const r = 22; const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  const isUrgent = timeLeft <= 3 && timeLeft > 0;

  return (
    <div className={`relative flex items-center justify-center ${isUrgent ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : ''}`}>
      <svg width="56" height="56" viewBox="0 0 56 56" className="transform -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="white" strokeWidth="4" opacity="0.15"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-1000 ease-linear"/>
      </svg>
      <span className={`absolute text-sm font-black ${isUrgent ? 'text-red-400' : 'text-white'}`}>
        {timeLeft}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   NumPad Component
   ───────────────────────────────────────────── */
const NumPad = ({ team, onPress, disabled, input, isShaking, isSuccess, focused, onFocus }: {
  team: 'A' | 'B'; onPress: (val: string) => void; disabled: boolean;
  input: string; isShaking: boolean; isSuccess: boolean;
  focused: boolean; onFocus: () => void;
}) => {
  const isA = team === 'A';
  const base = isA
    ? 'from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-blue-700/50'
    : 'from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-red-700/50';
  const border = isA ? 'border-blue-400/50' : 'border-red-400/50';
  const glow = isA ? 'shadow-[0_0_25px_rgba(59,130,246,0.3)]' : 'shadow-[0_0_25px_rgba(239,68,68,0.3)]';
  const teamLabel = isA ? '🔵 TEAM BLUE' : '🔴 TEAM RED';
  const teamBg = isA ? 'from-blue-600/30 to-blue-800/30' : 'from-red-600/30 to-red-800/30';

  const focusRing = focused
    ? isA ? 'ring-4 ring-blue-400/70 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'ring-4 ring-red-400/70 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
    : '';
  const tapHint = focused
    ? isA ? 'text-blue-300' : 'text-red-300'
    : 'text-white/40';

  return (
    <div className={`flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer rounded-3xl p-1 transition-all duration-300 ${focusRing}`}
         onClick={onFocus}>
      <div className={`text-[10px] sm:text-sm font-extrabold tracking-widest px-3 py-1 rounded-full bg-gradient-to-r ${teamBg} border ${border} backdrop-blur-md`}>
        {teamLabel}
      </div>
      {/* Answer display */}
      <div className={`
        relative w-[130px] sm:w-[170px] h-[44px] sm:h-[56px] rounded-2xl border-[3px] flex items-center justify-center
        text-2xl sm:text-4xl font-mono font-extrabold transition-all duration-200 overflow-hidden
        ${isShaking ? 'animate-[shake_0.4s_ease-in-out] border-red-500 bg-red-500/10 text-red-400' :
          isSuccess ? 'border-green-400 bg-green-500/15 text-green-400 scale-105' :
          `${border} bg-black/30 text-white`}
        ${glow}
      `}>
        {isSuccess && <div className="absolute inset-0 bg-green-400/10 animate-ping rounded-2xl"/>}
        {input || <span className="text-white/20 text-xl">?</span>}
      </div>
      {/* Focus hint */}
      <p className={`text-[8px] sm:text-[9px] font-medium transition-all ${tapHint}`}>
        {focused ? '⌨️ Type here!' : 'Tap to type'}
      </p>
      {/* Keypad Grid */}
      <div className={`grid grid-cols-3 gap-1 sm:gap-1.5 p-2 sm:p-2.5 rounded-2xl bg-black/30 border ${border} backdrop-blur-md ${glow}`}>
        {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(key => (
          <button key={key} disabled={disabled}
            onClick={(e) => { e.stopPropagation(); onFocus(); if (key==='⌫') onPress('DEL'); else if (key!=='✓') onPress(key); }}
            className={`
              w-[38px] h-[38px] sm:w-[50px] sm:h-[50px] md:w-[54px] md:h-[54px]
              rounded-xl font-bold text-base sm:text-xl text-white
              shadow-md transition-all duration-100 active:scale-90 active:shadow-sm
              disabled:opacity-40 disabled:cursor-not-allowed select-none
              ${key==='⌫' ? 'bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-400 hover:to-slate-600'
                : key==='✓' ? 'bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600'
                : `bg-gradient-to-b ${base}`}
            `}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Settings Panel
   ───────────────────────────────────────────── */
const SettingsPanel = ({ isOpen, onClose, timer, setTimer, pulls, setPulls, timerEnabled, setTimerEnabled }: {
  isOpen: boolean; onClose: () => void;
  timer: number; setTimer: (n: number) => void;
  pulls: number; setPulls: (n: number) => void;
  timerEnabled: boolean; setTimerEnabled: (b: boolean) => void;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" onClick={onClose}>
      <div className="bg-gradient-to-b from-indigo-900 to-purple-900 rounded-3xl border-2 border-white/20 p-6 sm:p-8 max-w-sm mx-4 shadow-2xl animate-[bounceIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-white">⚙️ Settings</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <X className="w-4 h-4 text-white"/>
          </button>
        </div>

        {/* Timer on/off */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-yellow-300">⏱️ Question Timer</label>
            <button onClick={() => setTimerEnabled(!timerEnabled)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 ${timerEnabled ? 'bg-green-500' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${timerEnabled ? 'left-[22px]' : 'left-0.5'}`}/>
            </button>
          </div>
          <p className="text-[10px] text-purple-300/60 mt-1">{timerEnabled ? 'Timer counts down each question' : 'No time limit — play at your own pace'}</p>
        </div>

        {/* Timer duration — only show when enabled */}
        {timerEnabled && (
          <div className="mb-5">
            <label className="text-sm font-bold text-yellow-300 mb-2 block">⏱️ Seconds Per Question</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setTimer(Math.max(5, timer - 1))}
                      className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-xl hover:bg-white/20 transition-all active:scale-90">−</button>
              <div className="flex-1 h-10 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl font-black text-white">
                {timer}
              </div>
              <button onClick={() => setTimer(Math.min(60, timer + 1))}
                      className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-xl hover:bg-white/20 transition-all active:scale-90">+</button>
            </div>
            <p className="text-[10px] text-purple-300/60 mt-1">Range: 5 – 60 seconds</p>
          </div>
        )}

        {/* Number of pulls */}
        <div className="mb-6">
          <label className="text-sm font-bold text-yellow-300 mb-2 block">🏋️ Pulls to Win</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setPulls(Math.max(3, pulls - 1))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-xl hover:bg-white/20 transition-all active:scale-90">−</button>
            <div className="flex-1 h-10 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl font-black text-white">
              {pulls}
            </div>
            <button onClick={() => setPulls(Math.min(15, pulls + 1))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-xl hover:bg-white/20 transition-all active:scale-90">+</button>
          </div>
          <p className="text-[10px] text-purple-300/60 mt-1">Range: 3 – 15 pulls</p>
        </div>

        <button onClick={onClose} className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black shadow-lg hover:shadow-xl transition-all active:scale-95">
          ✅ Done
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export default function MathTugOfWar() {
  const [level, setLevel] = useState(1);
  const [ropePos, setRopePos] = useState(0);
  const [problem, setProblem] = useState<Problem>({ num1:0, num2:0, op:'+', answer:0 });
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [winner, setWinner] = useState<Team>(null);
  const [started, setStarted] = useState(false);
  const [shakeA, setShakeA] = useState(false);
  const [shakeB, setShakeB] = useState(false);
  const [successA, setSuccessA] = useState(false);
  const [successB, setSuccessB] = useState(false);
  const [pulling, setPulling] = useState<Team>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [streak, setStreak] = useState<{team: Team, count: number}>({team:null,count:0});
  const [victoryDrag, setVictoryDrag] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focusedTeam, setFocusedTeam] = useState<'A' | 'B'>('A'); // which calculator receives keyboard input
  const bgMusicRef = useRef<BGMusic | null>(null);
  if (!bgMusicRef.current) bgMusicRef.current = new BGMusic();

  // Settings
  const [timerDuration, setTimerDuration] = useState(DEFAULT_TIMER);
  const [pullsToWin, setPullsToWin] = useState(DEFAULT_PULLS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);

  // Question Timer
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false); // track if game is active (not in countdown, not won)

  const snd = useCallback((fn: () => void) => { if (soundOn) fn(); }, [soundOn]);

  // Background music control
  useEffect(() => {
    const bg = bgMusicRef.current;
    if (!bg) return;
    if (soundOn && started && !winner && !paused) bg.start();
    else bg.stop();
    return () => { bg.stop(); };
  }, [soundOn, started, winner, paused]);

  useEffect(() => { setProblem(generateProblem(level)); }, [level]);

  // ─── Question Timer ───
  const startTimer = useCallback(() => {
    if (!timerEnabled) return; // timer disabled — no countdown
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(timerDuration);
    activeRef.current = true;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          activeRef.current = false;
          return 0;
        }
        if (prev <= 4) sfx.timerWarn();
        return prev - 1;
      });
    }, 1000);
  }, [timerDuration, timerEnabled]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    activeRef.current = false;
  }, []);

  // Stop the timer if user disables it mid-game
  useEffect(() => {
    if (!timerEnabled) {
      stopTimer();
      setTimeLeft(timerDuration); // reset to non-zero so keypads stay active
    }
  }, [timerEnabled, stopTimer, timerDuration]);

  // When timeLeft hits 0 during active game, skip to next question (only if timer enabled)
  useEffect(() => {
    if (!timerEnabled) return;
    if (timeLeft === 0 && started && !winner && countdown === null) {
      snd(sfx.timeout);
      // Flash both inputs red
      setShakeA(true); setShakeB(true);
      setTimeout(() => { setShakeA(false); setShakeB(false); }, 500);
      setTimeout(() => {
        setProblem(generateProblem(level));
        setInputA(''); setInputB('');
        startTimer();
      }, 800);
    }
  }, [timeLeft, started, winner, countdown, level, startTimer, snd, timerEnabled]);

  // ─── Handle keypad input ───
  const handleInput = useCallback((team: 'A' | 'B', val: string) => {
    if (winner || !started || countdown !== null || (timerEnabled && timeLeft === 0) || paused) return;
    snd(val === 'DEL' ? sfx.delete : sfx.click);

    const currentInput = team === 'A' ? inputA : inputB;
    const newVal = val === 'DEL' ? currentInput.slice(0,-1) : currentInput + val;
    if (newVal.length > 4) return;
    if (team === 'A') setInputA(newVal); else setInputB(newVal);

    if (newVal === '') return;
    const num = parseInt(newVal, 10);

    if (num === problem.answer) {
      stopTimer();
      snd(sfx.correct);
      if (team === 'A') { setSuccessA(true); setTimeout(()=>setSuccessA(false),600); setScoreA(s=>s+1); }
      else              { setSuccessB(true); setTimeout(()=>setSuccessB(false),600); setScoreB(s=>s+1); }

      setStreak(prev => prev.team===team ? {team,count:prev.count+1} : {team,count:1});
      setPulling(team);
      setTimeout(() => setPulling(null), 800);

      setRopePos(prev => {
        const next = team === 'A' ? prev - 1 : prev + 1;
        if (Math.abs(next) >= pullsToWin) {
          // Trigger dramatic victory drag — characters cross the center!
          setVictoryDrag(true);
          setTimeout(() => { setWinner(team); setShowConfetti(true); snd(sfx.win); }, 1200);
        }
        return next;
      });
      // Only generate a new problem if the game hasn't been won
      if (Math.abs(ropePos + (team === 'A' ? -1 : 1)) < pullsToWin) {
        setTimeout(() => {
          setProblem(generateProblem(level));
          setInputA(''); setInputB('');
          startTimer();
        }, 600);
      } else {
        // Game won — just clear inputs, don't start a new timer
        setTimeout(() => { setInputA(''); setInputB(''); }, 600);
      }
    } else {
      const ansStr = problem.answer.toString();
      if (newVal.length >= ansStr.length && num !== problem.answer) {
        snd(sfx.wrong);
        if (team === 'A') { setShakeA(true); setTimeout(()=>{setShakeA(false);setInputA('');},500); }
        else              { setShakeB(true); setTimeout(()=>{setShakeB(false);setInputB('');},500); }
      }
    }
  }, [inputA, inputB, problem, winner, started, countdown, level, soundOn, snd, pullsToWin, timeLeft, startTimer, stopTimer, timerEnabled, paused]);

  // ─── Start with countdown ───
  const startGame = useCallback(() => {
    stopTimer();
    setRopePos(0); setInputA(''); setInputB(''); setWinner(null);
    setShowConfetti(false); setScoreA(0); setScoreB(0); setVictoryDrag(false); setPaused(false);
    setStreak({team:null,count:0});
    setProblem(generateProblem(level));
    setCountdown(3);
    setStarted(true);
    setTimeLeft(timerDuration);
  }, [level, timerDuration, stopTimer]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      snd(sfx.countdownGo);
      startTimer();
      return;
    }
    snd(sfx.countdown);
    const t = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 800);
    return () => clearTimeout(t);
  }, [countdown, snd, startTimer]);

  const nextLevel = () => {
    if (level < MAX_LEVEL) { setLevel(l=>l+1); snd(sfx.levelUp); setTimeout(()=>startGame(), 300); }
  };

  // Clean up on unmount
  useEffect(() => { return () => { stopTimer(); bgMusicRef.current?.stop(); }; }, [stopTimer]);

  // Rope offset logic — works for ANY pullsToWin value (5, 10, 15 etc.):
  //
  // KEY RULE: Characters must NEVER cross the center yellow marker during
  // regular gameplay. Only the final winning pull crosses them over.
  //
  // How it works:
  //   • maxGameShift = 12%  →  the absolute maximum the group shifts during play.
  //     At 12% offset, characters are still clearly on their own side.
  //   • Each pull moves:  12% / pullsToWin  (e.g. 2.4% per pull if pullsToWin=5)
  //   • At the winning ropePos (±pullsToWin), base offset = ±12%.
  //   • victoryDrag adds an extra ±35%, making total ±47% — clearly crossing center.
  //
  //   Examples:
  //     pullsToWin=5  → 2.4%/pull  → at pull 4: 9.6%  → at win: 12%+35% = 47%
  //     pullsToWin=10 → 1.2%/pull  → at pull 9: 10.8% → at win: 12%+35% = 47%
  //
  const maxGameShift = 12;
  const perPull = maxGameShift / pullsToWin;
  const baseOffset = ropePos * perPull;
  const victoryExtra = victoryDrag ? (ropePos > 0 ? 35 : -35) : 0;
  const ropeOffset = baseOffset + victoryExtra;

  // Memoize star positions to avoid hydration mismatch from Math.random() in JSX
  const starPositions = useMemo(() => Array.from({length: 50}, () => ({
    size: `${1 + Math.random() * 2.5}px`,
    top: `${Math.random() * 50}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    opacity: 0.3 + Math.random() * 0.7,
  })), []);

  // Pause / Resume toggle
  const togglePause = useCallback(() => {
    if (paused) {
      setPaused(false);
      startTimer();
      bgMusicRef.current?.start();
    } else {
      setPaused(true);
      stopTimer();
      bgMusicRef.current?.stop();
    }
  }, [paused, startTimer, stopTimer]);

  // ─── Keyboard input — all keys go to the focused team ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const code = e.code;
      const key = e.key;

      // Space to pause/resume
      if (code === 'Space' && started && !winner) {
        e.preventDefault();
        togglePause();
        return;
      }

      // Enter to start game
      if (code === 'Enter' && !started) {
        e.preventDefault();
        startGame();
        return;
      }

      // Tab to switch focused team
      if (code === 'Tab') {
        e.preventDefault();
        setFocusedTeam(prev => prev === 'A' ? 'B' : 'A');
        return;
      }

      // Number keys (0-9) — go to focused team
      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleInput(focusedTeam, key);
        return;
      }

      // Backspace / Delete — delete on focused team
      if (code === 'Backspace' || code === 'Delete') {
        e.preventDefault();
        handleInput(focusedTeam, 'DEL');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, started, winner, startGame, togglePause, focusedTeam]);

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{
      background: 'linear-gradient(180deg, #0f0c29 0%, #1a1a3e 15%, #302b63 35%, #24243e 55%, #2d8659 78%, #3aa956 85%, #4abe5e 90%, #228B22 100%)',
    }}>
      {/* Stars */}
      {starPositions.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-[twinkle_3s_ease-in-out_infinite]" style={{
          width: s.size, height: s.size,
          top: s.top, left: s.left,
          animationDelay: s.delay, opacity: s.opacity,
        }}/>
      ))}

      {/* Moon */}
      <div className="absolute top-4 right-10 w-14 h-14 rounded-full bg-yellow-100 shadow-[0_0_30px_rgba(255,255,200,0.4)] opacity-60"/>
      <div className="absolute top-4 right-12 w-12 h-12 rounded-full bg-[#0f0c29]"/>

      {/* Clouds */}
      <Cloud top="6%" left="5%" size={110}/><Cloud top="14%" left="55%" size={85}/><Cloud top="10%" left="30%" size={95}/>

      {showConfetti && <Confetti/>}

      {/* ─── TOP BAR ─── */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-2 sm:p-3">
        <Link href="/" className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">
          <ArrowLeft className="w-4 h-4 text-white"/>
        </Link>
        <div className="text-center flex flex-col items-center">
          <h1 className="text-sm sm:text-lg font-extrabold text-white tracking-wide drop-shadow-lg">⚔️ Math Tug of War</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[9px] sm:text-xs text-yellow-300/80 font-medium">Lv {level}: {LEVEL_LABELS[level]}</p>
            <div className="flex gap-[3px]">
              {Array.from({length:MAX_LEVEL}).map((_,i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i+1<=level?'bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.6)]':'bg-white/20'}`}/>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {started && !winner && (
            <button onClick={togglePause} className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">
              {paused ? <Play className="w-4 h-4 text-green-400"/> : <Pause className="w-4 h-4 text-yellow-400"/>}
            </button>
          )}
          <button onClick={() => setSettingsOpen(true)} className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">
            <Settings className="w-4 h-4 text-white"/>
          </button>
          <button onClick={() => setSoundOn(!soundOn)} className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">
            {soundOn ? <Volume2 className="w-4 h-4 text-white"/> : <VolumeX className="w-4 h-4 text-white/50"/>}
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={()=>setSettingsOpen(false)}
                     timer={timerDuration} setTimer={setTimerDuration}
                     pulls={pullsToWin} setPulls={setPullsToWin}
                     timerEnabled={timerEnabled} setTimerEnabled={setTimerEnabled}/>

      {/* ─── START SCREEN ─── */}
      {!started ? (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="relative bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-[32px] border-2 border-white/20 p-5 sm:p-8 max-w-md mx-4 shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-[bounceIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-40 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none"/>
            <div className="text-center relative z-10">
              <div className="text-5xl mb-3 animate-[bounce_1s_ease-in-out_infinite]">⚔️</div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 drop-shadow-lg">Tug of War!</h2>
              <p className="text-purple-200/80 text-xs sm:text-sm mb-4">Two teams. One rope. Solve math problems faster to pull the rope to your side!</p>

              <div className="bg-black/30 rounded-2xl p-3 mb-3 text-left">
                <p className="text-yellow-300 font-bold text-xs mb-1.5">📋 How to Play:</p>
                <ul className="text-purple-200/90 text-[11px] sm:text-xs space-y-1">
                  <li>👉 <b>Tap</b> a team&apos;s calculator to select it, then type!</li>
                  <li>⚡ First to answer correctly pulls the rope!</li>
                  {timerEnabled ? (
                    <li>⏱️ You have <b>{timerDuration} seconds</b> per question!</li>
                  ) : (
                    <li>♾️ No time limit — take your time!</li>
                  )}
                  <li>🏆 Pull <b>{pullsToWin} times</b> to win the round!</li>
                  <li>↹ Press <b>Tab</b> to switch teams · <b>Space</b> to pause</li>
                </ul>
              </div>

              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center bg-black/30 rounded-xl overflow-hidden border border-white/5">
                  <button onClick={() => { if(level > 1) { setLevel(l => l - 1); snd(sfx.click); } }} 
                          className="px-2 py-3 hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-20"
                          disabled={level === 1}>
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                  <div className="flex-1 text-center py-1">
                    <p className="text-yellow-300/80 text-[10px] font-semibold">Level {level}</p>
                    <p className="text-[9px] text-white/90 leading-tight px-1 line-clamp-1">{LEVEL_LABELS[level]}</p>
                  </div>
                  <button onClick={() => { if(level < MAX_LEVEL) { setLevel(l => l + 1); snd(sfx.click); } }} 
                          className="px-2 py-3 hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-20"
                          disabled={level === MAX_LEVEL}>
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
                <button onClick={()=>setSettingsOpen(true)} className="px-4 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-all flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5"/> Settings
                </button>
              </div>

              <button onClick={startGame} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-base sm:text-lg shadow-[0_4px_20px_rgba(250,204,21,0.4)] hover:shadow-[0_4px_30px_rgba(250,204,21,0.6)] active:scale-95 transition-all">
                🎮 START GAME
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ─── COUNTDOWN ─── */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
              <div className="text-[100px] sm:text-[160px] font-black text-white animate-[countPulse_0.8s_ease-out] drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]" key={countdown}>
                {countdown}
              </div>
            </div>
          )}

          {/* ─── SCORE TRACK ─── */}
          <div className="absolute top-[52px] sm:top-[60px] left-0 right-0 z-20 flex items-center justify-center gap-2 sm:gap-3 px-4">
            <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 rounded-xl px-3 py-1.5 backdrop-blur-md">
              <span className="text-blue-400 text-xs font-black">🔵 BLUE</span>
              <span className="text-white text-lg font-black">{scoreA}</span>
            </div>
            <div className="bg-white/10 rounded-lg px-2.5 py-1">
              <div className="flex gap-1">
                {Array.from({length: pullsToWin * 2 - 1}).map((_,i) => {
                  const pos = i - (pullsToWin - 1);
                  const filled = pos <= -ropePos && pos < 0 ? 'bg-blue-400' : pos >= -ropePos && pos > 0 ? 'bg-red-400' : pos === 0 ? 'bg-yellow-400' : 'bg-white/20';
                  return <div key={i} className={`w-1.5 h-3 rounded-full ${filled} transition-all duration-300`}/>;
                })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-1.5 backdrop-blur-md">
              <span className="text-red-400 text-xs font-black">🔴 RED</span>
              <span className="text-white text-lg font-black">{scoreB}</span>
            </div>
          </div>

          {/* Timer + problem */}
          <div className="absolute top-[95px] sm:top-[105px] left-0 right-0 z-20 flex flex-col items-center gap-1.5">
            {timerEnabled && !winner && countdown === null && (
              <TimerCircle timeLeft={timeLeft} maxTime={timerDuration}/>
            )}
            {!winner && countdown === null && (
              <div className="bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-2xl border-2 border-white/20 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <p className="text-3xl sm:text-5xl font-black text-white text-center tracking-wider">
                  {problem.num1} <span className="text-yellow-400">{problem.op}</span> {problem.num2}
                </p>
              </div>
            )}
          </div>

          {/* ─── PAUSE OVERLAY ─── */}
          {paused && (
            <div className="absolute inset-0 flex items-center justify-center z-[45] bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
              <div className="bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-[28px] border-2 border-white/20 p-6 sm:p-8 max-w-xs mx-4 text-center shadow-2xl animate-[bounceIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
                <div className="text-5xl mb-3">⏸️</div>
                <h2 className="text-2xl font-black text-white mb-1">Game Paused</h2>
                <p className="text-purple-200/60 text-xs mb-4">Score: {scoreA} – {scoreB}</p>
                <div className="flex flex-col gap-2.5">
                  <button onClick={togglePause} className="w-full py-3 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-black font-black text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Play className="w-4 h-4"/> Resume
                  </button>
                  <div className="flex gap-2">
                    <button onClick={startGame} className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all active:scale-95">
                      🔄 Restart
                    </button>
                    {level < MAX_LEVEL && (
                      <button onClick={nextLevel} className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/20 text-blue-300 font-bold text-sm hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-1.5">
                        <SkipForward className="w-4 h-4"/> Next
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── CHARACTERS & ROPE ─── */}
          <div className="absolute bottom-[190px] sm:bottom-[220px] md:bottom-[240px] left-0 right-0 z-10">
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-b from-[#228B22] to-[#1a6b1a] z-0">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, #1a5c1a 8px, #1a5c1a 9px)' }}/>
            </div>

            {/* Center marker */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
              <div className="w-2.5 h-14 bg-yellow-400 rounded-t-sm shadow-[0_0_10px_rgba(250,204,21,0.5)]"/>
              <div className="w-7 h-2.5 bg-yellow-500 rounded-sm -ml-[9px]"/>
            </div>

            {/* Moving container */}
            <div className={`relative flex items-end justify-center z-20 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${victoryDrag ? 'transition-transform duration-[1200ms]' : 'transition-transform duration-700'}`}
                 style={{ transform: `translateX(${ropeOffset}%)` }}>
              <div className="flex items-end -mr-[14px] sm:-mr-[10px]">
                {[2,1,0].map(i => (
                  <div key={i} className={`${pulling==='A' ? 'animate-[pullBack_0.3s_ease-in-out_infinite_alternate]' : 'animate-[idleBounce_2s_ease-in-out_infinite]'}`}
                       style={{ animationDelay:`${i*0.15}s`, marginRight: i===0 ? '-10px' : '-6px' }}>
                    <CartoonCharacter isGirl={i%2===0} teamColor="#3B82F6" index={i} pulling={pulling==='A'} facingLeft={false} isFirst={i===0}/>
                  </div>
                ))}
              </div>
              <div className="relative z-30">
                <div className="w-[100px] sm:w-[160px] md:w-[220px] h-[8px] sm:h-[10px] relative">
                  <div className="absolute inset-0 rounded-full overflow-hidden" style={{
                    background: 'linear-gradient(180deg, #D2691E 0%, #8B4513 40%, #A0522D 60%, #8B4513 100%)',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 2px 3px rgba(255,255,255,0.15)',
                  }}>
                    <div className="absolute inset-0 opacity-40" style={{
                      backgroundImage: 'repeating-linear-gradient(60deg, transparent, transparent 4px, #3e2723 4px, #3e2723 6px)',
                    }}/>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -top-7 sm:-top-9 z-10">
                    <div className="w-1 h-7 sm:h-9 bg-gray-700 rounded-t-sm mx-auto"/>
                    <div className="w-4 sm:w-6 h-3 sm:h-4 bg-gradient-to-r from-red-500 to-red-600 -mt-7 sm:-mt-9 ml-1 rounded-r-sm shadow-md animate-[flagWave_1s_ease-in-out_infinite_alternate]"/>
                  </div>
                </div>
                <div className="absolute left-[-150px] sm:left-[-180px] top-[1px] sm:top-[2px] w-[154px] sm:w-[184px] h-[6px] sm:h-[7px] rounded-l-full" style={{
                  background: 'linear-gradient(180deg, #D2691E 0%, #8B4513 50%, #A0522D 100%)',
                }}/>
                <div className="absolute right-[-150px] sm:right-[-180px] top-[1px] sm:top-[2px] w-[154px] sm:w-[184px] h-[6px] sm:h-[7px] rounded-r-full" style={{
                  background: 'linear-gradient(180deg, #D2691E 0%, #8B4513 50%, #A0522D 100%)',
                }}/>
              </div>
              <div className="flex items-end -ml-[14px] sm:-ml-[10px]">
                {[0,1,2].map(i => (
                  <div key={i} className={`${pulling==='B' ? 'animate-[pullBack_0.3s_ease-in-out_infinite_alternate]' : 'animate-[idleBounce_2s_ease-in-out_infinite]'}`}
                       style={{ animationDelay:`${i*0.15}s`, marginLeft: i===0 ? '-10px' : '-6px' }}>
                    <CartoonCharacter isGirl={i%2===0} teamColor="#EF4444" index={i+3} pulling={pulling==='B'} facingLeft={true} isFirst={i===0}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {streak.count >= 2 && !winner && (
            <div className={`absolute bottom-[185px] sm:bottom-[215px] left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[10px] font-bold animate-[bounce_0.5s_ease-in-out_infinite] ${streak.team==='A'?'bg-blue-500 text-white':'bg-red-500 text-white'}`}>
              🔥 {streak.count}x Streak!
            </div>
          )}

          {/* ─── KEYPADS ─── */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-between items-end px-1.5 sm:px-4 pb-2 sm:pb-4">
            <NumPad team="A" onPress={v=>handleInput('A',v)} disabled={!!winner||countdown!==null||(timerEnabled && timeLeft===0)} input={inputA} isShaking={shakeA} isSuccess={successA} focused={focusedTeam==='A'} onFocus={()=>setFocusedTeam('A')}/>
            <NumPad team="B" onPress={v=>handleInput('B',v)} disabled={!!winner||countdown!==null||(timerEnabled && timeLeft===0)} input={inputB} isShaking={shakeB} isSuccess={successB} focused={focusedTeam==='B'} onFocus={()=>setFocusedTeam('B')}/>
          </div>

          {/* ─── WINNER ─── */}
          {winner && (
            <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]">
              <div className="bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-xl rounded-[28px] border-2 border-yellow-400/40 p-5 sm:p-8 max-w-sm mx-4 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-[bounceIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
                <div className="text-5xl mb-2 animate-[bounce_1s_ease-in-out_infinite]">🏆</div>
                <h2 className="text-2xl sm:text-3xl font-black mb-1">
                  {winner==='A' ? <span className="text-blue-400">BLUE WINS!</span> : <span className="text-red-400">RED WINS!</span>}
                </h2>
                <p className="text-purple-200/70 text-xs sm:text-sm mb-4">Score: {scoreA} – {scoreB}</p>
                <div className="flex gap-3">
                  <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all active:scale-95">
                    🔄 Replay
                  </button>
                  {level<MAX_LEVEL && (
                    <button onClick={nextLevel} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95">
                      ⬆️ Level {level+1}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── GLOBAL ANIMATIONS ─── */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px) rotate(-3deg)} 40%{transform:translateX(8px) rotate(3deg)} 60%{transform:translateX(-6px) rotate(-2deg)} 80%{transform:translateX(6px) rotate(2deg)} }
        @keyframes idleBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes idleBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes pullBack { 0%{transform:translateX(0) rotate(0)} 100%{transform:translateX(-6px) rotate(-8deg)} }
        @keyframes pullLegs { 0%{transform:skewX(0)} 100%{transform:skewX(-5deg)} }
        @keyframes pullArms { 0%{transform:rotate(0)} 100%{transform:rotate(-8deg)} }
        @keyframes blink { 0%,96%,100%{transform:scaleY(1)} 98%{transform:scaleY(0.1)} }
        @keyframes flagWave { 0%{transform:skewY(0deg)} 100%{transform:skewY(3deg)} }
        @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.05)} 70%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeIn { 0%{opacity:0} 100%{opacity:1} }
        @keyframes countPulse { 0%{transform:scale(0.5);opacity:0} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:0.9} }
        @keyframes confettiFall { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(100vh) rotate(720deg)} }
        @keyframes cloudFloat { 0%{transform:translateX(0)} 100%{transform:translateX(100vw)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      `}}/>
    </div>
  );
}
