"use client";

import type { PetStage } from "@/lib/types";

interface WaterBodyProps {
  stage: Exclude<PetStage, "egg">;
  primaryColor: string;
  secondaryColor: string;
}

export const WATER_ANCHORS = {
  head: { x: 100, y: 35 },
  body: { x: 100, y: 100 },
};

export function WaterBody({ stage, primaryColor: p, secondaryColor: s }: WaterBodyProps) {
  const scale = stage === "baby" ? 0.7 : stage === "juvenile" ? 0.85 : 1;
  const ty = stage === "baby" ? 30 : stage === "juvenile" ? 15 : 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="178" rx={35 * scale} ry="6" fill="black" opacity="0.08" />
      <g transform={`translate(0 ${ty}) scale(${scale})`} style={{ transformOrigin: "100px 100px" }}>
        {/* Rounded body */}
        <ellipse cx="100" cy="125" rx="38" ry="42" fill={p} />
        <ellipse cx="100" cy="133" rx="26" ry="27" fill={s} opacity="0.3" />
        {/* Head */}
        <circle cx="100" cy="78" r="28" fill={p} />
        {/* Water crest / fin */}
        <path d="M100 50 Q95 35 100 25 Q105 35 100 50" fill={s} />
        {stage !== "baby" && (
          <path d="M92 55 Q88 42 92 32 M108 55 Q112 42 108 32" fill="none" stroke={s} strokeWidth="3" strokeLinecap="round" />
        )}
        {/* Cheek bubbles */}
        <circle cx="78" cy="82" r="4" fill={s} opacity="0.3" />
        <circle cx="122" cy="82" r="4" fill={s} opacity="0.3" />
        {/* Flippers */}
        <ellipse cx="62" cy="115" rx="10" ry="15" fill={p} transform="rotate(20 62 115)" />
        <ellipse cx="138" cy="115" rx="10" ry="15" fill={p} transform="rotate(-20 138 115)" />
        {/* Tail fin */}
        <path d="M100 167 Q90 180 80 185 Q95 175 100 175 Q105 175 120 185 Q110 180 100 167" fill={s} opacity="0.6" />
        {/* Feet */}
        <ellipse cx="85" cy="167" rx="13" ry="7" fill={p} />
        <ellipse cx="115" cy="167" rx="13" ry="7" fill={p} />
        {stage === "adult" && (
          <>
            {/* Dorsal fin */}
            <path d="M65 90 Q50 70 45 55 Q55 68 60 75 Q52 60 50 45 Q58 65 65 80" fill={p} opacity="0.5" />
            <path d="M135 90 Q150 70 155 55 Q145 68 140 75 Q148 60 150 45 Q142 65 135 80" fill={p} opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}
