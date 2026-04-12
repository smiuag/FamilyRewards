"use client";

import type { PetSpecies, PetStage } from "@/lib/types";
import { FireBody } from "../pets/svg/bodies/FireBody";
import { WaterBody } from "../pets/svg/bodies/WaterBody";
import { PlantBody } from "../pets/svg/bodies/PlantBody";
import { ElectricBody } from "../pets/svg/bodies/ElectricBody";
import { ShadowBody } from "../pets/svg/bodies/ShadowBody";
import { PetEyes } from "../pets/svg/eyes/PetEyes";
import { AccessoryLayer } from "../pets/svg/accessories/AccessoryLayer";
import { BackgroundLayer } from "../pets/svg/backgrounds/BackgroundLayer";
import type { PetCardConfig } from "@/lib/minigame/constants";

interface MiniPetDisplayProps {
  pet: PetCardConfig;
}

/**
 * Simplified pet renderer for the minigame.
 * Renders species body + eyes + optional accessory directly (no inventory lookup).
 */
export function MiniPetDisplay({ pet }: MiniPetDisplayProps) {
  const { species, stage, primaryColor, secondaryColor, eyeStyle, accessorySvgKey, accessorySlot, backgroundSvgKey } = pet;
  const bodyStage = stage as "baby" | "juvenile" | "adult";

  return (
    <div className="relative w-full h-full">
      {backgroundSvgKey && <BackgroundLayer svgKey={backgroundSvgKey} />}
      <SpeciesBody
        species={species}
        stage={bodyStage}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
      <PetEyes eyeStyle={eyeStyle} stage={stage} species={species} />
      {accessorySvgKey && accessorySlot && (
        <AccessoryLayer
          slot={accessorySlot}
          svgKey={accessorySvgKey}
          species={species}
          stage={stage}
        />
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
  species: PetSpecies;
  stage: "baby" | "juvenile" | "adult";
  primaryColor: string;
  secondaryColor: string;
}) {
  switch (species) {
    case "fire":
      return <FireBody stage={stage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "water":
      return <WaterBody stage={stage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "plant":
      return <PlantBody stage={stage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "electric":
      return <ElectricBody stage={stage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case "shadow":
      return <ShadowBody stage={stage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    default:
      return <FireBody stage={stage} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
  }
}
