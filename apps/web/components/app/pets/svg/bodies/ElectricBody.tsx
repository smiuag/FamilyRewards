"use client";

import type { PetStage } from "@/lib/types";

interface ElectricBodyProps {
  stage: Exclude<PetStage, "egg">;
  primaryColor: string;
  secondaryColor: string;
}

export const ELECTRIC_ANCHORS = {
  head: { x: 100, y: 35 },
  body: { x: 100, y: 100 },
};

export function ElectricBody({ stage, primaryColor: p, secondaryColor: s }: ElectricBodyProps) {
  const scale = stage === "baby" ? 0.7 : stage === "juvenile" ? 0.85 : 1;
  const ty = stage === "baby" ? 30 : stage === "juvenile" ? 15 : 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="178" rx={35 * scale} ry="6" fill="black" opacity="0.08" />
      <g transform={`translate(0 ${ty}) scale(${scale})`} style={{ transformOrigin: "100px 100px" }}>
        {/* Angular body */}
        <ellipse cx="100" cy="128" rx="35" ry="40" fill={p} />
        <ellipse cx="100" cy="135" rx="22" ry="24" fill={s} opacity="0.3" />
        {/* Head - slightly pointy */}
        <ellipse cx="100" cy="82" rx="27" ry="25" fill={p} />
        {/* Lightning bolt ears */}
        <path d="M76 65 L68 48 L78 55 L72 35" fill={s} strokeLinejoin="round" />
        <path d="M124 65 L132 48 L122 55 L128 35" fill={s} strokeLinejoin="round" />
        {/* Static sparks */}
        {stage !== "baby" && (
          <g opacity="0.5">
            <line x1="65" y1="42" x2="60" y2="38" stroke={s} strokeWidth="2" strokeLinecap="round" />
            <line x1="135" y1="42" x2="140" y2="38" stroke={s} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {/* Cheek sparks */}
        <circle cx="78" cy="85" r="5" fill={s} opacity="0.4" />
        <circle cx="122" cy="85" r="5" fill={s} opacity="0.4" />
        {/* Arms */}
        <ellipse cx="65" cy="115" rx="9" ry="14" fill={p} transform="rotate(15 65 115)" />
        <ellipse cx="135" cy="115" rx="9" ry="14" fill={p} transform="rotate(-15 135 115)" />
        {/* Lightning tail */}
        <path d="M135 140 L148 125 L140 125 L155 105 L142 115 L150 115 L135 135" fill={s} opacity="0.7" />
        {/* Feet */}
        <ellipse cx="85" cy="167" rx="13" ry="7" fill={p} />
        <ellipse cx="115" cy="167" rx="13" ry="7" fill={p} />
        {stage === "adult" && (
          <>
            {/* Electric aura lines */}
            <path d="M55 80 L48 75 M50 95 L42 92 M55 110 L48 112" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <path d="M145 80 L152 75 M150 95 L158 92 M145 110 L152 112" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </>
        )}
      </g>
    </svg>
  );
}
