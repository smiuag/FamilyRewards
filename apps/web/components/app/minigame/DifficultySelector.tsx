"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { MinigameDifficulty } from "@/lib/types";
import { DIFFICULTY_CONFIG } from "@/lib/minigame/constants";
import { cn } from "@/lib/utils";

interface DifficultySelectorProps {
  onSelect: (difficulty: MinigameDifficulty) => void;
  gamesPlayed: number;
  maxDaily: number | null;
}

const DIFFICULTY_STYLES: Record<MinigameDifficulty, { emoji: string; gradient: string }> = {
  easy:   { emoji: "🌱", gradient: "from-green-400 to-emerald-500" },
  medium: { emoji: "🔥", gradient: "from-amber-400 to-orange-500" },
  hard:   { emoji: "💎", gradient: "from-purple-400 to-violet-600" },
};

export function DifficultySelector({ onSelect, gamesPlayed, maxDaily }: DifficultySelectorProps) {
  const t = useTranslations("minigame");
  const limitReached = maxDaily !== null && gamesPlayed >= maxDaily;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">{t("selectDifficulty")}</h2>
        {maxDaily !== null && (
          <p className="text-sm text-muted-foreground">
            {t("gamesPlayedToday", { count: gamesPlayed, max: maxDaily })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["easy", "medium", "hard"] as MinigameDifficulty[]).map((diff) => {
          const config = DIFFICULTY_CONFIG[diff];
          const style = DIFFICULTY_STYLES[diff];

          return (
            <button
              key={diff}
              type="button"
              onClick={() => onSelect(diff)}
              disabled={limitReached}
              className={cn(
                "text-left transition-all rounded-xl",
                limitReached
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
              )}
            >
              <Card className="p-4 overflow-hidden relative">
                <div className={cn(
                  "absolute inset-0 opacity-10 bg-gradient-to-br",
                  style.gradient,
                )} />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{style.emoji}</span>
                    <span className="font-bold">{t(diff)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{t("pairs", { count: config.pairs })}</div>
                    <div>{t("cards", { count: config.pairs * 2 })}</div>
                  </div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      {limitReached && (
        <p className="text-center text-sm text-destructive font-medium">
          {t("dailyLimitReached")}
        </p>
      )}
    </div>
  );
}
