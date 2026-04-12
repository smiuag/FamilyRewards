"use client";

import type { PetStage } from "@/lib/types";

interface FireBodyProps {
  stage: Exclude<PetStage, "egg">;
  primaryColor: string;
  secondaryColor: string;
}

// Anchor points for accessory positioning (same coordinate system as viewBox 200x200)
export const FIRE_ANCHORS = {
  head: { x: 100, y: 35 },
  body: { x: 100, y: 100 },
};

export function FireBody({ stage, primaryColor, secondaryColor }: FireBodyProps) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Shadow */}
      <ellipse cx="100" cy="178" rx={stage === "baby" ? 28 : stage === "juvenile" ? 35 : 42} ry="6" fill="black" opacity="0.08" />

      {stage === "baby" && <FireBaby primary={primaryColor} secondary={secondaryColor} />}
      {stage === "juvenile" && <FireJuvenile primary={primaryColor} secondary={secondaryColor} />}
      {stage === "adult" && <FireAdult primary={primaryColor} secondary={secondaryColor} />}
    </svg>
  );
}

function FireBaby({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <g>
      {/* Small round body */}
      <ellipse cx="100" cy="135" rx="30" ry="32" fill={primary} />
      {/* Belly */}
      <ellipse cx="100" cy="143" rx="20" ry="20" fill={secondary} opacity="0.4" />
      {/* Head */}
      <circle cx="100" cy="95" r="25" fill={primary} />
      {/* Flame tuft on head */}
      <path d="M95 72 Q98 55 100 48 Q102 55 105 72" fill={secondary} />
      <path d="M90 75 Q93 62 95 72" fill={secondary} opacity="0.6" />
      {/* Little arms */}
      <ellipse cx="72" cy="128" rx="8" ry="12" fill={primary} transform="rotate(15 72 128)" />
      <ellipse cx="128" cy="128" rx="8" ry="12" fill={primary} transform="rotate(-15 128 128)" />
      {/* Little feet */}
      <ellipse cx="85" cy="165" rx="12" ry="7" fill={primary} />
      <ellipse cx="115" cy="165" rx="12" ry="7" fill={primary} />
      {/* Tail stub */}
      <path d="M130 145 Q140 140 145 130" fill="none" stroke={secondary} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function FireJuvenile({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <g>
      {/* Body - taller */}
      <ellipse cx="100" cy="130" rx="35" ry="40" fill={primary} />
      {/* Belly */}
      <ellipse cx="100" cy="138" rx="24" ry="26" fill={secondary} opacity="0.35" />
      {/* Head */}
      <ellipse cx="100" cy="82" rx="28" ry="26" fill={primary} />
      {/* Flame crest */}
      <path d="M88 58 Q92 38 96 30 Q100 42 104 30 Q108 38 112 58" fill={secondary} />
      <path d="M92 62 Q95 48 98 58" fill={secondary} opacity="0.5" />
      {/* Small horns */}
      <path d="M78 68 Q74 55 72 50" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" />
      <path d="M122 68 Q126 55 128 50" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" />
      {/* Arms */}
      <ellipse cx="66" cy="118" rx="10" ry="16" fill={primary} transform="rotate(12 66 118)" />
      <ellipse cx="134" cy="118" rx="10" ry="16" fill={primary} transform="rotate(-12 134 118)" />
      {/* Claws */}
      <circle cx="64" cy="132" r="3" fill={secondary} />
      <circle cx="136" cy="132" r="3" fill={secondary} />
      {/* Feet */}
      <ellipse cx="82" cy="168" rx="14" ry="8" fill={primary} />
      <ellipse cx="118" cy="168" rx="14" ry="8" fill={primary} />
      {/* Tail with flame */}
      <path d="M135 140 Q150 130 155 115 Q158 105 152 95" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
      <circle cx="152" cy="95" r="6" fill={secondary} opacity="0.7" />
    </g>
  );
}

function FireAdult({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <g>
      {/* Body - largest */}
      <ellipse cx="100" cy="125" rx="40" ry="45" fill={primary} />
      {/* Belly */}
      <ellipse cx="100" cy="133" rx="28" ry="30" fill={secondary} opacity="0.3" />
      {/* Chest scales pattern */}
      <path d="M85 115 Q90 110 95 115 Q100 110 105 115 Q110 110 115 115" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.4" />
      <path d="M88 125 Q93 120 98 125 Q103 120 108 125 Q113 120 118 125" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.3" />
      {/* Head */}
      <ellipse cx="100" cy="72" rx="30" ry="28" fill={primary} />
      {/* Snout */}
      <ellipse cx="100" cy="85" rx="16" ry="10" fill={primary} />
      {/* Flame crown */}
      <path d="M80 48 Q85 25 90 18 Q95 30 100 15 Q105 30 110 18 Q115 25 120 48" fill={secondary} />
      <path d="M85 50 Q88 38 92 48" fill={secondary} opacity="0.5" />
      <path d="M108 50 Q112 38 115 48" fill={secondary} opacity="0.5" />
      {/* Horns */}
      <path d="M74 58 Q68 42 65 32" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
      <path d="M126 58 Q132 42 135 32" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
      {/* Arms with claws */}
      <ellipse cx="60" cy="110" rx="12" ry="20" fill={primary} transform="rotate(10 60 110)" />
      <ellipse cx="140" cy="110" rx="12" ry="20" fill={primary} transform="rotate(-10 140 110)" />
      <path d="M55 128 L50 135 M58 129 L55 136 M61 129 L60 136" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
      <path d="M145 128 L150 135 M142 129 L145 136 M139 129 L140 136" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
      {/* Feet with claws */}
      <ellipse cx="80" cy="168" rx="16" ry="9" fill={primary} />
      <ellipse cx="120" cy="168" rx="16" ry="9" fill={primary} />
      <path d="M68 168 L65 175 M73 170 L71 177 M78 170 L77 177" stroke={secondary} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M132 168 L135 175 M127 170 L129 177 M122 170 L123 177" stroke={secondary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Tail with flame tip */}
      <path d="M140 135 Q158 120 162 100 Q165 85 158 70" fill="none" stroke={primary} strokeWidth="6" strokeLinecap="round" />
      <path d="M158 70 Q165 55 155 50 Q162 60 152 62 Q160 58 158 70" fill={secondary} />
      {/* Wing hints */}
      <path d="M60 95 Q40 80 35 60 Q45 75 55 78 Q42 70 38 55 Q48 72 60 80" fill={primary} opacity="0.5" />
      <path d="M140 95 Q160 80 165 60 Q155 75 145 78 Q158 70 162 55 Q152 72 140 80" fill={primary} opacity="0.5" />
    </g>
  );
}
