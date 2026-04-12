"use client";

import type { PetStage } from "@/lib/types";

interface ShadowBodyProps {
  stage: Exclude<PetStage, "egg">;
  primaryColor: string;
  secondaryColor: string;
}

export const SHADOW_ANCHORS = {
  head: { x: 100, y: 35 },
  body: { x: 100, y: 100 },
};

export function ShadowBody({ stage, primaryColor: p, secondaryColor: s }: ShadowBodyProps) {
  const scale = stage === "baby" ? 0.7 : stage === "juvenile" ? 0.85 : 1;
  const ty = stage === "baby" ? 30 : stage === "juvenile" ? 15 : 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="178" rx={35 * scale} ry="6" fill="black" opacity="0.08" />
      <g transform={`translate(0 ${ty}) scale(${scale})`} style={{ transformOrigin: "100px 100px" }}>
        {/* Misty body - slightly irregular */}
        <ellipse cx="100" cy="128" rx="37" ry="42" fill={p} />
        <ellipse cx="100" cy="135" rx="25" ry="26" fill={s} opacity="0.15" />
        {/* Wispy edges */}
        <ellipse cx="65" cy="130" rx="8" ry="12" fill={p} opacity="0.5" />
        <ellipse cx="135" cy="125" rx="8" ry="14" fill={p} opacity="0.5" />
        {/* Head */}
        <circle cx="100" cy="80" r="27" fill={p} />
        {/* Ethereal horns/ears */}
        <path d="M78 60 Q72 42 75 30" fill="none" stroke={s} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <path d="M122 60 Q128 42 125 30" fill="none" stroke={s} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        {stage !== "baby" && (
          <>
            {/* Moon symbol on forehead */}
            <path d="M96 62 Q92 56 96 50 Q90 53 90 60 Q90 67 96 70 Q92 64 96 62" fill={s} opacity="0.5" />
          </>
        )}
        {/* Ghost arms */}
        <path d="M63 115 Q50 108 45 98 Q55 105 60 100 Q50 100 45 90" fill={p} opacity="0.4" />
        <path d="M137 115 Q150 108 155 98 Q145 105 140 100 Q150 100 155 90" fill={p} opacity="0.4" />
        {/* Wispy bottom (no solid feet) */}
        <path d="M70 165 Q80 175 90 168 Q95 175 100 170 Q105 175 110 168 Q120 175 130 165" fill={p} opacity="0.6" />
        {stage === "adult" && (
          <>
            {/* Floating mist particles */}
            <circle cx="55" cy="75" r="3" fill={s} opacity="0.2" />
            <circle cx="148" cy="70" r="2.5" fill={s} opacity="0.2" />
            <circle cx="45" cy="100" r="2" fill={s} opacity="0.15" />
            <circle cx="155" cy="95" r="2" fill={s} opacity="0.15" />
            {/* Ethereal wings */}
            <path d="M63 85 Q40 65 35 45 Q50 60 55 55 Q42 50 40 35 Q55 55 63 70" fill={s} opacity="0.2" />
            <path d="M137 85 Q160 65 165 45 Q150 60 145 55 Q158 50 160 35 Q145 55 137 70" fill={s} opacity="0.2" />
          </>
        )}
      </g>
    </svg>
  );
}
