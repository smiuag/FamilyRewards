"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PawPrint } from "lucide-react";
import { usePetStore } from "@/lib/store/usePetStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyPet, calculatePetMood } from "@/lib/api/pets";
import { PetDisplay } from "./PetDisplay";
import { PET_STAGE_THRESHOLDS, PET_STAGE_ORDER } from "@/lib/pet/constants";
import type { PetMood } from "@/lib/types";

const MOOD_EMOJI: Record<PetMood, string> = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
};

const STAGE_LABELS: Record<string, { es: string; en: string }> = {
  egg: { es: "Huevo", en: "Egg" },
  baby: { es: "Cría", en: "Baby" },
  juvenile: { es: "Joven", en: "Juvenile" },
  adult: { es: "Adulto", en: "Adult" },
};

export function PetDashboardCard() {
  const t = useTranslations("pets");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { pet, loadPet, accessories, inventory } = usePetStore();
  const { taskInstances, featuresUnlocked } = useAppStore();

  const petsEnabled = featuresUnlocked.includes("pets");

  useEffect(() => {
    if (petsEnabled) fetchFamilyPet().then(loadPet).catch(() => {});
  }, [loadPet, petsEnabled]);

  // Don't render if pets feature is not unlocked
  if (!petsEnabled) return null;

  const today = new Date().toISOString().split("T")[0];
  const mood = pet && pet.stage !== "egg" ? calculatePetMood(taskInstances, today) : "neutral";

  // Calculate progress to next stage
  const nextStageIdx = pet ? PET_STAGE_ORDER.indexOf(pet.stage) + 1 : 0;
  const nextStage = nextStageIdx < PET_STAGE_ORDER.length ? PET_STAGE_ORDER[nextStageIdx] : null;
  const currentThreshold = pet ? PET_STAGE_THRESHOLDS[pet.stage] : 0;
  const nextThreshold = nextStage ? PET_STAGE_THRESHOLDS[nextStage] : 0;
  const progressRange = nextThreshold - currentThreshold;
  const progressValue = pet && progressRange > 0
    ? Math.min(((pet.carePoints - currentThreshold) / progressRange) * 100, 100)
    : 100;

  // No pet yet — show CTA
  if (!pet) {
    return (
      <Card className="shadow-sm">
        <CardContent className="pt-5">
          <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
            <PawPrint className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">{t("dashboardNoPet")}</p>
            <button
              onClick={() => router.push(`/${locale}/pets`)}
              className="text-xs text-primary hover:underline"
            >
              {t("adoptCta")}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stageLabel = STAGE_LABELS[pet.stage]?.[locale === "en" ? "en" : "es"] ?? pet.stage;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-primary" />
            {pet.name}
          </CardTitle>
          <button
            onClick={() => router.push(`/${locale}/pets`)}
            className="text-xs text-primary hover:underline"
          >
            {t("dashboardViewPet")}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <PetDisplay
            pet={pet}
            mood={mood}
            size="sm"
            inventory={inventory}
            accessories={accessories}
          />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{MOOD_EMOJI[mood]}</span>
              <span className="text-sm text-muted-foreground">{stageLabel}</span>
            </div>
            {nextStage && (
              <div>
                <Progress value={progressValue} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("careProgress", {
                    current: pet.carePoints - currentThreshold,
                    needed: progressRange,
                  })}
                </p>
              </div>
            )}
            {!nextStage && (
              <p className="text-xs text-muted-foreground">
                {stageLabel} — {pet.carePoints} {t("carePoints").toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
