"use client";

interface BackgroundLayerProps {
  svgKey: string;
}

export function BackgroundLayer({ svgKey }: BackgroundLayerProps) {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none">
      {svgKey === "rainbow" && <RainbowBg />}
      {svgKey === "stars-bg" && <StarsBg />}
      {svgKey === "hearts-bg" && <HeartsBg />}
      {svgKey === "flames-bg" && <FlamesBg />}
      {svgKey === "bubbles-bg" && <BubblesBg />}
    </svg>
  );
}

function RainbowBg() {
  return (
    <g opacity="0.2">
      <path d="M20 160 Q100 20 180 160" fill="none" stroke="#EF4444" strokeWidth="4" />
      <path d="M25 160 Q100 30 175 160" fill="none" stroke="#F97316" strokeWidth="4" />
      <path d="M30 160 Q100 40 170 160" fill="none" stroke="#FBBF24" strokeWidth="4" />
      <path d="M35 160 Q100 50 165 160" fill="none" stroke="#22C55E" strokeWidth="4" />
      <path d="M40 160 Q100 60 160 160" fill="none" stroke="#3B82F6" strokeWidth="4" />
      <path d="M45 160 Q100 70 155 160" fill="none" stroke="#8B5CF6" strokeWidth="4" />
    </g>
  );
}

function StarsBg() {
  const stars = [
    { x: 25, y: 20, s: 4 }, { x: 170, y: 15, s: 3.5 }, { x: 45, y: 50, s: 2.5 },
    { x: 155, y: 45, s: 3 }, { x: 20, y: 90, s: 2 }, { x: 180, y: 85, s: 2.5 },
    { x: 30, y: 140, s: 3 }, { x: 165, y: 150, s: 2 }, { x: 50, y: 170, s: 2.5 },
    { x: 150, y: 175, s: 3 },
  ];
  return (
    <g opacity="0.25">
      {stars.map((st, i) => (
        <path
          key={i}
          d={`M${st.x} ${st.y - st.s} L${st.x + st.s * 0.35} ${st.y - st.s * 0.35} L${st.x + st.s} ${st.y} L${st.x + st.s * 0.35} ${st.y + st.s * 0.35} L${st.x} ${st.y + st.s} L${st.x - st.s * 0.35} ${st.y + st.s * 0.35} L${st.x - st.s} ${st.y} L${st.x - st.s * 0.35} ${st.y - st.s * 0.35} Z`}
          fill="#FBBF24"
        />
      ))}
    </g>
  );
}

function HeartsBg() {
  const hearts = [
    { x: 30, y: 25, s: 0.5 }, { x: 170, y: 20, s: 0.4 }, { x: 20, y: 80, s: 0.3 },
    { x: 175, y: 90, s: 0.5 }, { x: 35, y: 150, s: 0.35 }, { x: 160, y: 155, s: 0.45 },
    { x: 50, y: 175, s: 0.3 }, { x: 145, y: 178, s: 0.35 },
  ];
  return (
    <g opacity="0.2">
      {hearts.map((h, i) => (
        <path
          key={i}
          transform={`translate(${h.x} ${h.y}) scale(${h.s})`}
          d="M0 8 C-5 -4 -15 -4 -15 4 C-15 12 0 20 0 20 C0 20 15 12 15 4 C15 -4 5 -4 0 8"
          fill="#EC4899"
        />
      ))}
    </g>
  );
}

function FlamesBg() {
  return (
    <g opacity="0.15">
      <path d="M20 180 Q25 150 20 130 Q30 145 35 120 Q38 140 45 180" fill="#F97316" />
      <path d="M155 180 Q160 145 155 120 Q165 140 170 115 Q175 140 180 180" fill="#F97316" />
      <path d="M10 180 Q15 160 12 145 Q18 155 22 180" fill="#FBBF24" />
      <path d="M175 180 Q178 155 185 140 Q182 158 190 180" fill="#FBBF24" />
    </g>
  );
}

function BubblesBg() {
  const bubbles = [
    { x: 25, y: 30, r: 8 }, { x: 170, y: 25, r: 6 }, { x: 40, y: 70, r: 5 },
    { x: 160, y: 65, r: 7 }, { x: 20, y: 120, r: 6 }, { x: 180, y: 110, r: 5 },
    { x: 35, y: 160, r: 7 }, { x: 165, y: 155, r: 6 }, { x: 50, y: 180, r: 4 },
  ];
  return (
    <g opacity="0.15">
      {bubbles.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke="#3B82F6" strokeWidth="1.5" />
          <circle cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.3} r={b.r * 0.2} fill="white" opacity="0.5" />
        </g>
      ))}
    </g>
  );
}
