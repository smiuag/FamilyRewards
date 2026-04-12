import type { MinigameDifficulty, PetSpecies, PetStage } from "@/lib/types";

// ── Game types ────────────────────────────────────────────

export type MinigameType = "match" | "quiz" | "sequence" | "oddone";

export const GAME_TYPES: MinigameType[] = ["match", "quiz", "sequence", "oddone"];

export const GAME_LABELS: Record<MinigameType, { emoji: string; key: string }> = {
  match:    { emoji: "🃏", key: "gameMatch" },
  quiz:     { emoji: "🔍", key: "gameQuiz" },
  sequence: { emoji: "🧠", key: "gameSequence" },
  oddone:   { emoji: "🚫", key: "gameOddOne" },
};

// ── Match config ──────────────────────────────────────────

export interface MatchConfig {
  pairs: number;
  gridCols: number;
  maxTimeForBonus: number;
}

export const MATCH_CONFIG: Record<MinigameDifficulty, MatchConfig> = {
  easy:   { pairs: 4,  gridCols: 4, maxTimeForBonus: 60 },
  medium: { pairs: 6,  gridCols: 4, maxTimeForBonus: 120 },
  hard:   { pairs: 8,  gridCols: 4, maxTimeForBonus: 180 },
};

// ── Quiz config ───────────────────────────────────────────

export interface QuizConfig {
  rounds: number;
  options: number;       // number of choices (including the correct one)
  showTimeMs: number;    // initial time to memorize (ms)
  minShowTimeMs: number; // minimum show time at later rounds
  maxTimeForBonus: number;
}

export const QUIZ_CONFIG: Record<MinigameDifficulty, QuizConfig> = {
  easy:   { rounds: 5, options: 4,  showTimeMs: 3000, minShowTimeMs: 2000, maxTimeForBonus: 60 },
  medium: { rounds: 5, options: 9,  showTimeMs: 2000, minShowTimeMs: 1200, maxTimeForBonus: 90 },
  hard:   { rounds: 5, options: 16, showTimeMs: 1500, minShowTimeMs: 800,  maxTimeForBonus: 120 },
};

// ── Sequence config ───────────────────────────────────────

export interface SequenceConfig {
  maxRounds: number;
  poolSize: number;       // number of distinct pets to choose from
  showDelayMs: number;    // time each pet is highlighted
  maxTimeForBonus: number;
}

export const SEQUENCE_CONFIG: Record<MinigameDifficulty, SequenceConfig> = {
  easy:   { maxRounds: 6,  poolSize: 4, showDelayMs: 500, maxTimeForBonus: 60 },
  medium: { maxRounds: 10, poolSize: 5, showDelayMs: 350, maxTimeForBonus: 120 },
  hard:   { maxRounds: 14, poolSize: 6, showDelayMs: 250, maxTimeForBonus: 180 },
};

// ── Odd-one config ────────────────────────────────────────

export interface OddOneConfig {
  rounds: number;
  optionCount: number;    // total options (including the odd one)
  roundTimeMs: number;    // time limit per round
  maxTimeForBonus: number;
}

export const ODDONE_CONFIG: Record<MinigameDifficulty, OddOneConfig> = {
  easy:   { rounds: 5,  optionCount: 4, roundTimeMs: 8000, maxTimeForBonus: 60 },
  medium: { rounds: 8,  optionCount: 5, roundTimeMs: 6000, maxTimeForBonus: 90 },
  hard:   { rounds: 12, optionCount: 6, roundTimeMs: 4000, maxTimeForBonus: 120 },
};

// Keep old DIFFICULTY_CONFIG as alias for match (used by MinigameBoard)
export const DIFFICULTY_CONFIG = MATCH_CONFIG;

// ── Card types ────────────────────────────────────────────

export interface PetCardConfig {
  species: PetSpecies;
  stage: Exclude<PetStage, "egg">;
  eyeStyle: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundSvgKey: string | null;
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

// ── Card generation (delegates to pet-generators) ─────────

import { shuffle, generateUniquePetConfigs, maybeAddAccessory } from "./pet-generators";

/** Generates a shuffled array of GameCards (each pet appears twice). */
export function generatePetCards(difficulty: MinigameDifficulty): GameCard[] {
  const { pairs } = MATCH_CONFIG[difficulty];
  const configs = generateUniquePetConfigs(pairs);
  for (const c of configs) maybeAddAccessory(c);

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
