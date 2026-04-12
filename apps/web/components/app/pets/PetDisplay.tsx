"use client";

import { useRef, useState, useEffect } from "react";
import type { FamilyPet, PetAccessory, PetInventoryItem, PetMood, PetStage } from "@/lib/types";
import { PET_STAGE_THRESHOLDS } from "@/lib/pet/constants";
import { EggSvg } from "./svg/EggSvg";
import { FireBody } from "./svg/bodies/FireBody";
import { WaterBody } from "./svg/bodies/WaterBody";
import { PlantBody } from "./svg/bodies/PlantBody";
import { ElectricBody } from "./svg/bodies/ElectricBody";
import { ShadowBody } from "./svg/bodies/ShadowBody";
import { PetEyes } from "./svg/eyes/PetEyes";
import { AccessoryLayer } from "./svg/accessories/AccessoryLayer";
import { BackgroundLayer } from "./svg/backgrounds/BackgroundLayer";

interface PetDisplayProps {
  pet: FamilyPet;
  mood?: PetMood;
  inventory?: PetInventoryItem[];
  accessories?: PetAccessory[];
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const SIZE_MAP = {
  sm: "w-20 h-20",
  md: "w-40 h-40",
  lg: "w-56 h-56",
};

const MOOD_ANIMATION: Record<PetMood, string> = {
  happy: "animate-pet-happy",
  neutral: "animate-pet-idle",
  sad: "animate-pet-sad",
};

export function PetDisplay({
  pet,
  mood = "neutral",
  inventory = [],
  accessories = [],
  size = "md",
  animate = true,
}: PetDisplayProps) {
  const prevStageRef = useRef(pet.stage);
  const [hatching, setHatching] = useState<"idle" | "cracking" | "revealing">("idle");

  // Detect stage change for hatch animation
  useEffect(() => {
    if (prevStageRef.current === "egg" && pet.stage === "baby") {
      setHatching("cracking");
      const timer1 = setTimeout(() => setHatching("revealing"), 1000);
      const timer2 = setTimeout(() => setHatching("idle"), 2000);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
    prevStageRef.current = pet.stage;
  }, [pet.stage]);

  // Calculate egg care progress (0-1 towards hatching)
  const eggProgress = pet.stage === "egg"
    ? Math.min(pet.carePoints / PET_STAGE_THRESHOLDS.baby, 1)
    : 0;

  // Find active background accessory
  const bgAccessoryId = pet.activeAccessories.background;
  const bgAccessory = bgAccessoryId
    ? accessories.find((a) => a.id === bgAccessoryId)
    : null;
  const hasBg = bgAccessory && inventory.some((i) => i.accessoryId === bgAccessoryId);

  // Find active head/body accessories
  const headAccessoryId = pet.activeAccessories.head;
  const headAccessory = headAccessoryId
    ? accessories.find((a) => a.id === headAccessoryId)
    : null;
  const hasHead = headAccessory && inventory.some((i) => i.accessoryId === headAccessoryId);

  const bodyAccessoryId = pet.activeAccessories.body;
  const bodyAccessory = bodyAccessoryId
    ? accessories.find((a) => a.id === bodyAccessoryId)
    : null;
  const hasBody = bodyAccessory && inventory.some((i) => i.accessoryId === bodyAccessoryId);

  const animClass = animate && hatching === "idle" ? MOOD_ANIMATION[mood] : "";

  return (
    <div className={`relative ${SIZE_MAP[size]}`}>
      {/* Background layer */}
      {hasBg && bgAccessory && (
        <BackgroundLayer svgKey={bgAccessory.svgKey} />
      )}

      {/* Main pet layer */}
      <div className={`relative w-full h-full ${animClass}`}>
        {/* Egg or creature */}
        {pet.stage === "egg" || hatching === "cracking" ? (
          <div className={hatching === "cracking" ? "animate-hatch-crack" : ""}>
            <EggSvg
              species={pet.species}
              primaryColor={pet.primaryColor}
              secondaryColor={pet.secondaryColor}
              careProgress={eggProgress}
              shake={eggProgress > 0.8}
            />
          </div>
        ) : null}

        {pet.stage !== "egg" && hatching !== "cracking" && (
          <div className={hatching === "revealing" ? "animate-hatch-reveal" : ""}>
            {/* Species body */}
            <SpeciesBody
              species={pet.species!}
              stage={pet.stage}
              primaryColor={pet.primaryColor}
              secondaryColor={pet.secondaryColor}
            />

            {/* Eyes */}
            <PetEyes eyeStyle={pet.eyeStyle} stage={pet.stage} />

            {/* Head accessory */}
            {hasHead && headAccessory && pet.species && (
              <AccessoryLayer
                slot="head"
                svgKey={headAccessory.svgKey}
                species={pet.species}
                stage={pet.stage}
              />
            )}

            {/* Body accessory */}
            {hasBody && bodyAccessory && pet.species && (
              <AccessoryLayer
                slot="body"
                svgKey={bodyAccessory.svgKey}
                species={pet.species}
                stage={pet.stage}
              />
            )}
          </div>
        )}
      </div>

      {/* Sparkles during evolution */}
      {hatching === "revealing" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute text-lg animate-sparkle"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 60}%`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SpeciesBody({
  species,
  stage,
  primaryColor,
  secondaryColor,
}: {
  species: string;
  stage: Exclude<PetStage, "egg">;
  primaryColor: string;
  secondaryColor: string;
}) {
  const bodyStage = stage as "baby" | "juvenile" | "adult";
  switch (species) {
    case "fire":
      return <FireBody stage={bodyStage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "water":
      return <WaterBody stage={bodyStage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "plant":
      return <PlantBody stage={bodyStage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "electric":
      return <ElectricBody stage={bodyStage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "shadow":
      return <ShadowBody stage={bodyStage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    default:
      return <FireBody stage={bodyStage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
  }
}
