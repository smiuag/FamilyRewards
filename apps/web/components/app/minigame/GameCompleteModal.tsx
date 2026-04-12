"use client";

import { useTranslations } from "next-intl";
import {
  AppModal,
  AppModalHeader,
  AppModalBody,
  AppModalFooter,
} from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import type { MinigameDifficulty } from "@/lib/types";
import type { GameScore } from "@/lib/minigame/constants";

interface GameCompleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  difficulty: MinigameDifficulty;
  moves: number;
  timeSeconds: number;
  perfect: boolean;
  score: GameScore;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameCompleteModal({
  open,
  onOpenChange,
  difficulty,
  moves,
  timeSeconds,
  perfect,
  score,
  onPlayAgain,
  onBackToMenu,
}: GameCompleteModalProps) {
  const t = useTranslations("minigame");

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalHeader
        emoji={perfect ? "🏆" : "🎉"}
        title={t("gameComplete")}
        description={perfect ? t("perfect") : undefined}
        color={perfect
          ? "bg-gradient-to-r from-amber-500 to-yellow-400"
          : "bg-gradient-to-r from-green-500 to-emerald-400"
        }
      />

      <AppModalBody>
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label={t("time")} value={formatTime(timeSeconds)} />
          <StatCard label={t("moves")} value={String(moves)} />
          <StatCard label={t("selectDifficulty")} value={t(difficulty)} />
          <StatCard
            label={t("accuracy")}
            value={`${Math.round((score.accuracyBonus / Math.max(score.base, 1)) * 100)}%`}
          />
        </div>

        {/* Points breakdown */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("basePoints")}</span>
            <span className="font-semibold">+{score.base}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("speedBonus")}</span>
            <span className="font-semibold text-blue-500">+{score.speedBonus}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("accuracyBonus")}</span>
            <span className="font-semibold text-green-500">+{score.accuracyBonus}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>{t("totalPoints")}</span>
            <span className="text-primary">+{score.total}</span>
          </div>
        </div>
      </AppModalBody>

      <AppModalFooter className="flex-col sm:flex-row">
        <Button variant="outline" onClick={onBackToMenu} className="w-full sm:w-auto">
          {t("backToMenu")}
        </Button>
        <Button onClick={onPlayAgain} className="w-full sm:w-auto">
          {t("playAgain")}
        </Button>
      </AppModalFooter>
    </AppModal>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
