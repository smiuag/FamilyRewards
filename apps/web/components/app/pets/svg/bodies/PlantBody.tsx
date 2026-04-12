"use client";

import type { PetStage } from "@/lib/types";

interface PlantBodyProps {
  stage: Exclude<PetStage, "egg">;
  primaryColor: string;
  secondaryColor: string;
}

export const PLANT_ANCHORS = {
  head: { x: 100, y: 35 },
  body: { x: 100, y: 100 },
};

export function PlantBody({ stage, primaryColor: p, secondaryColor: s }: PlantBodyProps) {
  const scale = stage === "baby" ? 0.7 : stage === "juvenile" ? 0.85 : 1;
  const ty = stage === "baby" ? 30 : stage === "juvenile" ? 15 : 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="178" rx={35 * scale} ry="6" fill="black" opacity="0.08" />
      <g transform={`translate(0 ${ty}) scale(${scale})`} style={{ transformOrigin: "100px 100px" }}>
        {/* Body - slightly bulbous like a plant bulb */}
        <ellipse cx="100" cy="130" rx="36" ry="40" fill={p} />
        <ellipse cx="100" cy="138" rx="24" ry="24" fill={s} opacity="0.3" />
        {/* Head */}
        <circle cx="100" cy="85" r="26" fill={p} />
        {/* Leaf sprout on top */}
        <path d="M95 60 Q85 40 80 28 Q92 42 95 60" fill={s} />
        <path d="M105 60 Q115 40 120 28 Q108 42 105 60" fill={s} />
        {stage !== "baby" && (
          <path d="M100 62 Q100 45 100 30" fill="none" stroke={p} strokeWidth="2" />
        )}
        {/* Flower on head for adult */}
        {stage === "adult" && (
          <g>
            <circle cx="100" cy="28" r="6" fill={s} />
            <circle cx="94" cy="24" r="4" fill={s} opacity="0.7" />
            <circle cx="106" cy="24" r="4" fill={s} opacity="0.7" />
            <circle cx="100" cy="28" r="3" fill="#FBBF24" />
          </g>
        )}
        {/* Rosy cheeks */}
        <circle cx="80" cy="88" r="5" fill="#FCA5A5" opacity="0.4" />
        <circle cx="120" cy="88" r="5" fill="#FCA5A5" opacity="0.4" />
        {/* Leaf arms */}
        <path d="M64 120 Q50 110 42 100 Q52 108 58 105 Q48 102 42 92 Q55 108 64 112" fill={s} opacity="0.7" />
        <path d="M136 120 Q150 110 158 100 Q148 108 142 105 Q152 102 158 92 Q145 108 136 112" fill={s} opacity="0.7" />
        {/* Root feet */}
        <ellipse cx="85" cy="168" rx="12" ry="7" fill={p} />
        <ellipse cx="115" cy="168" rx="12" ry="7" fill={p} />
        {stage === "adult" && (
          <>
            {/* Vine accents */}
            <path d="M72 155 Q65 162 60 170 Q68 165 72 160" fill={s} opacity="0.4" />
            <path d="M128 155 Q135 162 140 170 Q132 165 128 160" fill={s} opacity="0.4" />
          </>
        )}
      </g>
    </svg>
  );
}
