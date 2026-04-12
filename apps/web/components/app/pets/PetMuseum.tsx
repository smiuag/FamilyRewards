"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { FamilyPet } from "@/lib/types";
import { PetDisplay } from "./PetDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { PET_SPECIES_CONFIG } from "@/lib/pet/constants";

interface PetMuseumProps {
  pets: FamilyPet[];
}

export function PetMuseum({ pets }: PetMuseumProps) {
  const t = useTranslations("pets");
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  if (pets.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
        <Building2 className="w-4 h-4" />
        {t("museumTitle")}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {pets.map((pet) => {
          const speciesConfig = pet.species ? PET_SPECIES_CONFIG[pet.species] : null;
          const speciesLabel = speciesConfig
            ? (locale === "en" ? speciesConfig.labelEn : speciesConfig.label)
            : "";
          const retiredDate = pet.retiredAt
            ? new Date(pet.retiredAt).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES", {
                day: "numeric", month: "short", year: "numeric",
              })
            : "";

          return (
            <Card key={pet.id} className="shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-amber-50 to-transparent p-3 flex justify-center">
                <PetDisplay
                  pet={pet}
                  mood="happy"
                  size="sm"
                  animate={false}
                />
              </div>
              <CardContent className="pt-2 pb-3 px-3 space-y-0.5">
                <p className="font-bold text-sm truncate">{pet.name}</p>
                <p className="text-xs text-muted-foreground">
                  {speciesLabel} {speciesConfig?.emoji}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pet.carePoints} CP
                </p>
                {retiredDate && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {t("museumRetiredOn", { date: retiredDate })}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
