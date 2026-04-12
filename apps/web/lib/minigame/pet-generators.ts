import type { PetSpecies, PetStage } from "@/lib/types";
import { PET_SPECIES_CONFIG, PET_EYE_STYLES } from "@/lib/pet/constants";
import type { PetCardConfig } from "./constants";

const SPECIES: PetSpecies[] = ["fire", "water", "plant", "electric", "shadow"];
const STAGES: Exclude<PetStage, "egg">[] = ["baby", "juvenile", "adult"];
const HEAD_ACCESSORIES = ["crown", "party-hat", "sunglasses", "bow", "wizard-hat"];
const BODY_ACCESSORIES = ["cape", "scarf", "star-necklace", "bowtie", "armor"];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build the full pool of possible pet configs (5 species × 3 stages × 8 eyes = 120). */
function buildPool(): PetCardConfig[] {
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
  return pool;
}

/** Pick N unique random pet configs from the full pool. */
export function generateUniquePetConfigs(count: number): PetCardConfig[] {
  return shuffle(buildPool()).slice(0, count);
}

/** Generate a single random pet config. */
export function generateRandomPet(): PetCardConfig {
  return generateUniquePetConfigs(1)[0];
}

/** Optionally attach a random accessory to a pet (mutates). */
export function maybeAddAccessory(config: PetCardConfig, chance = 0.4): void {
  if (Math.random() < chance) {
    const isHead = Math.random() < 0.5;
    config.accessorySlot = isHead ? "head" : "body";
    config.accessorySvgKey = randomPick(isHead ? HEAD_ACCESSORIES : BODY_ACCESSORIES);
  }
}

/**
 * Generate distractors that share at least 1 attribute with target
 * (same species OR same stage) but are NOT identical.
 */
export function generateSimilarOptions(
  target: PetCardConfig,
  count: number,
): PetCardConfig[] {
  const pool = buildPool().filter(
    (p) =>
      // Must share something
      (p.species === target.species || p.stage === target.stage) &&
      // But not be identical
      !(p.species === target.species && p.stage === target.stage && p.eyeStyle === target.eyeStyle),
  );
  const selected = shuffle(pool).slice(0, count);
  // Copy accessory from target to some distractors for extra difficulty
  for (const s of selected) {
    if (target.accessorySvgKey && Math.random() < 0.3) {
      s.accessorySvgKey = target.accessorySvgKey;
      s.accessorySlot = target.accessorySlot;
    }
  }
  return selected;
}

/**
 * Generate a pet that shares NOTHING with the reference:
 * different species AND different stage AND no shared accessory.
 */
export function generateOddOne(reference: PetCardConfig): PetCardConfig {
  const otherSpecies = SPECIES.filter((s) => s !== reference.species);
  const otherStages = STAGES.filter((s) => s !== reference.stage);

  const species = randomPick(otherSpecies);
  const stage = randomPick(otherStages);
  const eyeStyle = randomPick(PET_EYE_STYLES);
  const { defaultPrimary, defaultSecondary } = PET_SPECIES_CONFIG[species];

  return {
    species,
    stage,
    eyeStyle,
    primaryColor: defaultPrimary,
    secondaryColor: defaultSecondary,
    accessorySvgKey: null,
    accessorySlot: null,
  };
}

/**
 * Generate options that share AT LEAST 1 attribute with reference.
 * Used for the "wrong" options in Pet Descarte.
 */
export function generateSharesAttribute(
  reference: PetCardConfig,
  count: number,
): PetCardConfig[] {
  const pool = buildPool().filter(
    (p) =>
      (p.species === reference.species || p.stage === reference.stage) &&
      !(p.species === reference.species && p.stage === reference.stage && p.eyeStyle === reference.eyeStyle),
  );
  return shuffle(pool).slice(0, count);
}
