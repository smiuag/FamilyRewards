"use client";

import type { PetSpecies } from "@/lib/types";

interface EggSvgProps {
  species: PetSpecies | null;
  primaryColor: string;
  secondaryColor: string;
  careProgress: number; // 0-1
  shake?: boolean;
}

export function EggSvg({ species, primaryColor, secondaryColor, careProgress, shake }: EggSvgProps) {
  const baseColor = species ? primaryColor : "#F5F5F4";
  const accentColor = species ? secondaryColor : "#D6D3D1";
  const glowColor = species ? primaryColor : "transparent";

  return (
    <div
      className={`relative ${shake ? "animate-egg-shake" : ""}`}
      style={{ "--egg-glow-color": glowColor } as React.CSSProperties}
    >
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full ${species ? "animate-egg-glow" : ""}`}
      >
        {/* Egg shadow */}
        <ellipse cx="100" cy="175" rx="45" ry="8" fill="black" opacity="0.08" />

        {/* Egg body */}
        <ellipse cx="100" cy="110" rx="52" ry="65" fill={baseColor} />
        <ellipse cx="100" cy="110" rx="52" ry="65" fill="white" opacity="0.15" />

        {/* Species-specific patterns on egg */}
        {species === "fire" && (
          <>
            <path d="M70 130 Q80 110 75 90 Q85 100 90 85 Q95 105 100 95 Q105 110 115 90 Q110 110 120 100 Q125 120 130 130" fill={accentColor} opacity="0.5" />
            <path d="M80 140 Q90 125 95 115 Q100 130 110 120 Q115 135 120 140" fill={primaryColor} opacity="0.3" />
          </>
        )}
        {species === "water" && (
          <>
            <ellipse cx="82" cy="100" rx="8" ry="12" fill={accentColor} opacity="0.4" transform="rotate(-15 82 100)" />
            <ellipse cx="110" cy="115" rx="6" ry="10" fill={accentColor} opacity="0.35" transform="rotate(10 110 115)" />
            <ellipse cx="95" cy="130" rx="7" ry="9" fill={accentColor} opacity="0.3" transform="rotate(-5 95 130)" />
          </>
        )}
        {species === "plant" && (
          <>
            <path d="M85 80 Q90 60 100 55 Q95 70 100 80" fill={accentColor} opacity="0.5" />
            <path d="M105 75 Q115 55 120 50 Q115 65 110 78" fill={primaryColor} opacity="0.4" />
            <circle cx="90" cy="120" r="4" fill={accentColor} opacity="0.3" />
            <circle cx="112" cy="110" r="3" fill={accentColor} opacity="0.25" />
          </>
        )}
        {species === "electric" && (
          <>
            <path d="M85 85 L90 100 L82 100 L95 125" fill="none" stroke={accentColor} strokeWidth="2.5" opacity="0.5" />
            <path d="M110 80 L115 95 L107 95 L120 120" fill="none" stroke={primaryColor} strokeWidth="2" opacity="0.4" />
          </>
        )}
        {species === "shadow" && (
          <>
            <circle cx="88" cy="105" r="10" fill={accentColor} opacity="0.2" />
            <circle cx="112" cy="100" r="8" fill={accentColor} opacity="0.15" />
            <circle cx="100" cy="125" r="12" fill={primaryColor} opacity="0.1" />
          </>
        )}

        {/* Highlight/shine */}
        <ellipse cx="85" cy="85" rx="12" ry="18" fill="white" opacity="0.25" transform="rotate(-20 85 85)" />

        {/* Cracks based on progress */}
        {careProgress > 0.5 && (
          <path d="M88 70 L92 82 L86 85 L90 95" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
        )}
        {careProgress > 0.75 && (
          <path d="M112 75 L108 88 L114 92 L110 100" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
        )}
        {careProgress > 0.9 && (
          <path d="M95 60 L100 68 L94 72" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        )}
      </svg>
    </div>
  );
}
