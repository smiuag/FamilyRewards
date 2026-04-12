import type { MinigameDifficulty } from "@/lib/types";
import type { PetSpecies, PetStage } from "@/lib/types";
import { PET_SPECIES_CONFIG, PET_EYE_STYLES } from "@/lib/pet/constants";

// ── Difficulty config ─────────────────────────────────────

export interface DifficultyConfig {
  pairs: number;
  gridCols: number;
  maxTimeForBonus: number; // seconds — beyond this, no speed bonus
}

export const DIFFICULTY_CONFIG: Record<MinigameDifficulty, DifficultyConfig> = {
  easy:   { pairs: 4,  gridCols: 4, maxTimeForBonus: 60 },
  medium: { pairs: 6,  gridCols: 4, maxTimeForBonus: 120 },
  hard:   { pairs: 8,  gridCols: 4, maxTimeForBonus: 180 },
};

// ── Card types ────────────────────────────────────────────

export interface PetCardConfig {
  species: PetSpecies;
  stage: Exclude<PetStage, "egg">;
  eyeStyle: string;
  primaryColor: string;
  secondaryColor: string;
  accessorySvgKey: string | null;
  accessorySlot: "head" | "body" | null;
}

export interface GameCard {
  id: string;
  pairId: string;       // shared between the two matching cards
  pet: PetCardConfig;
  isFlipped: boolean;
  isMatched: boolean;
}

// ── Accessory svg keys for random selection ───────────────

const HEAD_ACCESSORIES = ["crown", "party-hat", "sunglasses", "bow", "wizard-hat"];
const BODY_ACCESSORIES = ["cape", "scarf", "star-necklace", "bowtie", "armor"];

// ── Card generation ───────────────────────────────────────

const SPECIES: PetSpecies[] = ["fire", "water", "plant", "electric", "shadow"];
const STAGES: Exclude<PetStage, "egg">[] = ["baby", "juvenile", "adult"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateUniquePetConfigs(count: number): PetCardConfig[] {
  // Build pool of all possible combos (species × stage × eyeStyle = 120)
  const pool: PetCardConfig[] = [];
  for (const species of SPECIES) {
    const { defaultPrimary, defaultSecondary } = PET_SPECIES_CONFIG[species];
    for (const stage of STAGES) {
      for (const eyeStyle of PET_EYE_STYLES) {
        pool.push({
          species,
          stage,
          eyeStyle,
          primaryColor: defaultPrimary,
          secondaryColor: defaultSecondary,
          accessorySvgKey: null,
          accessorySlot: null,
        });
      }
    }
  }

  // Shuffle and pick `count` unique configs
  const selected = shuffle(pool).slice(0, count);

  // Add a random accessory to some cards for visual variety
  for (const config of selected) {
    if (Math.random() < 0.4) {
      const isHead = Math.random() < 0.5;
      config.accessorySlot = isHead ? "head" : "body";
      config.accessorySvgKey = isHead
        ? HEAD_ACCESSORIES[Math.floor(Math.random() * HEAD_ACCESSORIES.length)]
        : BODY_ACCESSORIES[Math.floor(Math.random() * BODY_ACCESSORIES.length)];
    }
  }

  return selected;
}

/** Generates a shuffled array of GameCards (each pet appears twice). */
export function generatePetCards(difficulty: MinigameDifficulty): GameCard[] {
  const { pairs } = DIFFICULTY_CONFIG[difficulty];
  const configs = generateUniquePetConfigs(pairs);

  const cards: GameCard[] = [];
  configs.forEach((pet, i) => {
    const pairId = `pair-${i}`;
    cards.push(
      { id: `${pairId}-a`, pairId, pet, isFlipped: false, isMatched: false },
      { id: `${pairId}-b`, pairId, pet, isFlipped: false, isMatched: false },
    );
  });

  return shuffle(cards);
}

// ── Scoring ───────────────────────────────────────────────

export interface GameScore {
  base: number;
  speedBonus: number;
  accuracyBonus: number;
  total: number;
}

export function calculateScore(
  moves: number,
  timeSeconds: number,
  totalPairs: number,
  difficulty: MinigameDifficulty,
  pointsBase: number,
): GameScore {
  const { maxTimeForBonus } = DIFFICULTY_CONFIG[difficulty];

  const base = pointsBase;
  const speedBonus = Math.max(0, Math.floor(pointsBase * (1 - timeSeconds / maxTimeForBonus)));
  const accuracyBonus = moves > 0
    ? Math.floor(pointsBase * (totalPairs / moves))
    : 0;

  return {
    base,
    speedBonus,
    accuracyBonus,
    total: base + speedBonus + accuracyBonus,
  };
}
