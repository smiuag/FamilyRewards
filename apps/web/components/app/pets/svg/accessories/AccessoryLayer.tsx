"use client";

import type { AccessorySlot, PetSpecies, PetStage } from "@/lib/types";

interface AccessoryLayerProps {
  slot: "head" | "body";
  svgKey: string;
  species: PetSpecies;
  stage: Exclude<PetStage, "egg">;
}

// Anchor positions per species/stage for head slot
const HEAD_Y: Record<string, Record<Exclude<PetStage, "egg">, number>> = {
  fire:     { baby: 68, juvenile: 52, adult: 42 },
  water:    { baby: 58, juvenile: 50, adult: 42 },
  plant:    { baby: 58, juvenile: 52, adult: 42 },
  electric: { baby: 58, juvenile: 52, adult: 42 },
  shadow:   { baby: 58, juvenile: 50, adult: 42 },
};

const BODY_Y: Record<string, Record<Exclude<PetStage, "egg">, number>> = {
  fire:     { baby: 120, juvenile: 108, adult: 100 },
  water:    { baby: 115, juvenile: 105, adult: 98 },
  plant:    { baby: 118, juvenile: 108, adult: 100 },
  electric: { baby: 118, juvenile: 108, adult: 100 },
  shadow:   { baby: 118, juvenile: 105, adult: 98 },
};

export function AccessoryLayer({ slot, svgKey, species, stage }: AccessoryLayerProps) {
  const yMap = slot === "head" ? HEAD_Y : BODY_Y;
  const y = yMap[species]?.[stage] ?? (slot === "head" ? 45 : 100);

  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none">
      <g transform={`translate(100 ${y})`}>
        <AccessorySvg svgKey={svgKey} slot={slot} />
      </g>
    </svg>
  );
}

function AccessorySvg({ svgKey, slot }: { svgKey: string; slot: AccessorySlot }) {
  switch (svgKey) {
    // Head accessories
    case "crown":
      return (
        <g transform="translate(-18 -22)">
          <path d="M0 22 L6 5 L12 15 L18 0 L24 15 L30 5 L36 22 Z" fill="#FBBF24" />
          <rect x="0" y="18" width="36" height="6" rx="1" fill="#F59E0B" />
          <circle cx="18" cy="8" r="2.5" fill="#EF4444" />
          <circle cx="8" cy="14" r="2" fill="#3B82F6" />
          <circle cx="28" cy="14" r="2" fill="#22C55E" />
        </g>
      );
    case "party-hat":
      return (
        <g transform="translate(-14 -30)">
          <path d="M14 0 L0 30 L28 30 Z" fill="#EC4899" />
          <line x1="5" y1="20" x2="23" y2="20" stroke="#FBBF24" strokeWidth="2" />
          <line x1="8" y1="12" x2="20" y2="12" stroke="#3B82F6" strokeWidth="2" />
          <circle cx="14" cy="0" r="3" fill="#FBBF24" />
        </g>
      );
    case "sunglasses":
      return (
        <g transform="translate(-18 -6)">
          <rect x="0" y="0" width="14" height="10" rx="3" fill="#1a1a1a" />
          <rect x="22" y="0" width="14" height="10" rx="3" fill="#1a1a1a" />
          <line x1="14" y1="5" x2="22" y2="5" stroke="#1a1a1a" strokeWidth="2" />
          <rect x="2" y="2" width="3" height="4" rx="1" fill="white" opacity="0.2" />
          <rect x="24" y="2" width="3" height="4" rx="1" fill="white" opacity="0.2" />
        </g>
      );
    case "bow":
      return (
        <g transform="translate(-14 -10)">
          <path d="M14 10 Q5 0 0 5 Q5 10 14 10" fill="#EC4899" />
          <path d="M14 10 Q23 0 28 5 Q23 10 14 10" fill="#EC4899" />
          <circle cx="14" cy="10" r="3" fill="#DB2777" />
        </g>
      );
    case "wizard-hat":
      return (
        <g transform="translate(-22 -38)">
          <path d="M22 0 L8 38 L36 38 Z" fill="#6D28D9" />
          <ellipse cx="22" cy="38" rx="22" ry="5" fill="#5B21B6" />
          <circle cx="22" cy="14" r="3" fill="#FBBF24" />
          <path d="M16 26 Q22 22 28 26" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
        </g>
      );

    // Body accessories
    case "cape":
      return (
        <g transform="translate(-25 -5)">
          <path d="M5 0 Q0 30 10 55 L25 50 L40 55 Q50 30 45 0 Z" fill="#DC2626" opacity="0.8" />
          <path d="M5 0 L45 0" fill="none" stroke="#FBBF24" strokeWidth="2" />
        </g>
      );
    case "scarf":
      return (
        <g transform="translate(-20 -4)">
          <path d="M0 0 Q10 8 20 4 Q30 0 40 4" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
          <path d="M35 4 L38 18 L32 20 L35 4" fill="#2563EB" />
        </g>
      );
    case "star-necklace":
      return (
        <g transform="translate(-16 -2)">
          <path d="M0 0 Q16 12 32 0" fill="none" stroke="#D4D4D8" strokeWidth="1.5" />
          <path d="M16 10 L17.5 6 L21 6 L18.5 3.5 L19.5 0 L16 2 L12.5 0 L13.5 3.5 L11 6 L14.5 6 Z" fill="#FBBF24" />
        </g>
      );
    case "bowtie":
      return (
        <g transform="translate(-12 -6)">
          <path d="M12 6 Q4 0 0 3 Q4 6 0 9 Q4 12 12 6" fill="#1a1a1a" />
          <path d="M12 6 Q20 0 24 3 Q20 6 24 9 Q20 12 12 6" fill="#1a1a1a" />
          <circle cx="12" cy="6" r="2" fill="#DC2626" />
        </g>
      );
    case "armor":
      return (
        <g transform="translate(-20 -10)">
          <path d="M5 0 L0 10 L5 30 L15 35 L20 32 L25 35 L35 30 L40 10 L35 0 Z" fill="#94A3B8" />
          <path d="M15 5 L15 20 L20 25 L25 20 L25 5 Z" fill="#CBD5E1" />
          <circle cx="20" cy="12" r="3" fill="#FBBF24" />
        </g>
      );

    default:
      return null;
  }
}
