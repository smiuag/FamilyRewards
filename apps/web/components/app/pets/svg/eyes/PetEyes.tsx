"use client";

import type { PetStage } from "@/lib/types";

interface PetEyesProps {
  eyeStyle: string;
  stage: Exclude<PetStage, "egg">;
}

// Eye positions vary by stage
const EYE_CONFIG = {
  baby: { leftX: 90, rightX: 110, y: 92, size: 5, pupil: 2.5 },
  juvenile: { leftX: 88, rightX: 112, y: 78, size: 6, pupil: 3 },
  adult: { leftX: 88, rightX: 112, y: 68, size: 7, pupil: 3.5 },
} as const;

export function PetEyes({ eyeStyle, stage }: PetEyesProps) {
  const cfg = EYE_CONFIG[stage];

  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
      {eyeStyle === "happy" && <HappyEyes {...cfg} />}
      {eyeStyle === "sad" && <SadEyes {...cfg} />}
      {eyeStyle === "sleepy" && <SleepyEyes {...cfg} />}
      {eyeStyle === "excited" && <ExcitedEyes {...cfg} />}
      {eyeStyle === "surprised" && <SurprisedEyes {...cfg} />}
      {eyeStyle === "love" && <LoveEyes {...cfg} />}
      {eyeStyle === "angry" && <AngryEyes {...cfg} />}
      {eyeStyle === "cool" && <CoolEyes {...cfg} />}
    </svg>
  );
}

interface EyeProps {
  leftX: number;
  rightX: number;
  y: number;
  size: number;
  pupil: number;
}

function HappyEyes({ leftX, rightX, y, size }: EyeProps) {
  return (
    <g>
      {/* Happy arc eyes */}
      <path d={`M${leftX - size} ${y} Q${leftX} ${y - size * 1.5} ${leftX + size} ${y}`} fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <path d={`M${rightX - size} ${y} Q${rightX} ${y - size * 1.5} ${rightX + size} ${y}`} fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function SadEyes({ leftX, rightX, y, size, pupil }: EyeProps) {
  return (
    <g>
      <circle cx={leftX} cy={y} r={size} fill="white" />
      <circle cx={rightX} cy={y} r={size} fill="white" />
      <circle cx={leftX} cy={y + 1} r={pupil} fill="#1a1a1a" />
      <circle cx={rightX} cy={y + 1} r={pupil} fill="#1a1a1a" />
      {/* Sad eyebrows */}
      <line x1={leftX - size} y1={y - size - 1} x2={leftX + size} y2={y - size + 2} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={rightX - size} y1={y - size + 2} x2={rightX + size} y2={y - size - 1} stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function SleepyEyes({ leftX, rightX, y, size }: EyeProps) {
  return (
    <g>
      <line x1={leftX - size} y1={y} x2={leftX + size} y2={y} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <line x1={rightX - size} y1={y} x2={rightX + size} y2={y} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      {/* Z particles */}
      <text x={rightX + size + 5} y={y - 8} fontSize="8" fill="#94a3b8" fontWeight="bold">z</text>
      <text x={rightX + size + 12} y={y - 14} fontSize="6" fill="#94a3b8" fontWeight="bold">z</text>
    </g>
  );
}

function ExcitedEyes({ leftX, rightX, y, size, pupil }: EyeProps) {
  return (
    <g>
      <circle cx={leftX} cy={y} r={size} fill="white" />
      <circle cx={rightX} cy={y} r={size} fill="white" />
      {/* Big sparkly pupils */}
      <circle cx={leftX} cy={y} r={pupil * 1.3} fill="#1a1a1a" />
      <circle cx={rightX} cy={y} r={pupil * 1.3} fill="#1a1a1a" />
      {/* Sparkle dots */}
      <circle cx={leftX - 1} cy={y - 1.5} r="1" fill="white" />
      <circle cx={rightX - 1} cy={y - 1.5} r="1" fill="white" />
    </g>
  );
}

function SurprisedEyes({ leftX, rightX, y, size }: EyeProps) {
  return (
    <g>
      <circle cx={leftX} cy={y} r={size * 1.2} fill="white" />
      <circle cx={rightX} cy={y} r={size * 1.2} fill="white" />
      <circle cx={leftX} cy={y} r={size * 0.5} fill="#1a1a1a" />
      <circle cx={rightX} cy={y} r={size * 0.5} fill="#1a1a1a" />
    </g>
  );
}

function LoveEyes({ leftX, rightX, y, size }: EyeProps) {
  const s = size * 0.7;
  return (
    <g>
      {/* Heart-shaped eyes */}
      <path d={`M${leftX} ${y + s * 0.5} C${leftX - s} ${y - s} ${leftX} ${y - s * 1.5} ${leftX} ${y - s * 0.3} C${leftX} ${y - s * 1.5} ${leftX + s} ${y - s} ${leftX} ${y + s * 0.5}`} fill="#EF4444" />
      <path d={`M${rightX} ${y + s * 0.5} C${rightX - s} ${y - s} ${rightX} ${y - s * 1.5} ${rightX} ${y - s * 0.3} C${rightX} ${y - s * 1.5} ${rightX + s} ${y - s} ${rightX} ${y + s * 0.5}`} fill="#EF4444" />
    </g>
  );
}

function AngryEyes({ leftX, rightX, y, size, pupil }: EyeProps) {
  return (
    <g>
      <circle cx={leftX} cy={y} r={size} fill="white" />
      <circle cx={rightX} cy={y} r={size} fill="white" />
      <circle cx={leftX} cy={y} r={pupil} fill="#1a1a1a" />
      <circle cx={rightX} cy={y} r={pupil} fill="#1a1a1a" />
      {/* Angry eyebrows (V shape) */}
      <line x1={leftX - size} y1={y - size + 2} x2={leftX + size} y2={y - size - 2} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      <line x1={rightX - size} y1={y - size - 2} x2={rightX + size} y2={y - size + 2} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function CoolEyes({ leftX, rightX, y, size }: EyeProps) {
  return (
    <g>
      {/* Sunglasses */}
      <rect x={leftX - size - 1} y={y - size + 1} width={size * 2 + 2} height={size * 1.4} rx="2" fill="#1a1a1a" />
      <rect x={rightX - size - 1} y={y - size + 1} width={size * 2 + 2} height={size * 1.4} rx="2" fill="#1a1a1a" />
      {/* Bridge */}
      <line x1={leftX + size + 1} y1={y - size * 0.3 + 1} x2={rightX - size - 1} y2={y - size * 0.3 + 1} stroke="#1a1a1a" strokeWidth="1.5" />
      {/* Lens shine */}
      <rect x={leftX - size + 2} y={y - size + 3} width={3} height={size * 0.6} rx="1" fill="white" opacity="0.3" />
      <rect x={rightX - size + 2} y={y - size + 3} width={3} height={size * 0.6} rx="1" fill="white" opacity="0.3" />
    </g>
  );
}
