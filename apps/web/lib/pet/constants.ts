import type { PetSpecies, PetStage } from "@/lib/types";

// ── Growth thresholds (care points needed to reach each stage) ──

export const PET_STAGE_THRESHOLDS: Record<PetStage, number> = {
  egg: 0,
  baby: 50,
  juvenile: 200,
  adult: 500,
};

export const PET_STAGE_ORDER: PetStage[] = ["egg", "baby", "juvenile", "adult"];

export function getNextStage(current: PetStage): PetStage | null {
  const idx = PET_STAGE_ORDER.indexOf(current);
  return idx < PET_STAGE_ORDER.length - 1 ? PET_STAGE_ORDER[idx + 1] : null;
}

export function getStageForCarePoints(carePoints: number): PetStage {
  if (carePoints >= PET_STAGE_THRESHOLDS.adult) return "adult";
  if (carePoints >= PET_STAGE_THRESHOLDS.juvenile) return "juvenile";
  if (carePoints >= PET_STAGE_THRESHOLDS.baby) return "baby";
  return "egg";
}

// ── Care points ────────────────────────────────────────────

export const CARE_POINTS_PER_TASK = 1;

// ── Species config ─────────────────────────────────────────

export interface SpeciesConfig {
  label: string;
  labelEn: string;
  emoji: string;
  defaultPrimary: string;
  defaultSecondary: string;
}

export const PET_SPECIES_CONFIG: Record<PetSpecies, SpeciesConfig> = {
  fire: {
    label: "Fuego",
    labelEn: "Fire",
    emoji: "🔥",
    defaultPrimary: "#F97316",
    defaultSecondary: "#FBBF24",
  },
  water: {
    label: "Agua",
    labelEn: "Water",
    emoji: "💧",
    defaultPrimary: "#3B82F6",
    defaultSecondary: "#93C5FD",
  },
  plant: {
    label: "Planta",
    labelEn: "Plant",
    emoji: "🌱",
    defaultPrimary: "#22C55E",
    defaultSecondary: "#86EFAC",
  },
  electric: {
    label: "Eléctrico",
    labelEn: "Electric",
    emoji: "⚡",
    defaultPrimary: "#EAB308",
    defaultSecondary: "#FDE68A",
  },
  shadow: {
    label: "Sombra",
    labelEn: "Shadow",
    emoji: "🌙",
    defaultPrimary: "#8B5CF6",
    defaultSecondary: "#C4B5FD",
  },
};

// ── Eye styles ─────────────────────────────────────────────

export const PET_EYE_STYLES = [
  "happy",
  "sad",
  "sleepy",
  "excited",
  "surprised",
  "love",
  "angry",
  "cool",
] as const;

export type PetEyeStyle = (typeof PET_EYE_STYLES)[number];
