"use client";

import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useMinigameStore } from "@/lib/store/useMinigameStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export function WeeklyRanking() {
  const t = useTranslations("minigame");
  const ranking = useMinigameStore((s) => s.weeklyRanking);
  const currentUser = useAppStore((s) => s.currentUser);

  if (ranking.length === 0) {
    return (
      <Card className="p-5 text-center text-muted-foreground text-sm">
        {t("noGamesYet")}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="font-bold text-sm">{t("weeklyRanking")}</h3>
      </div>

      <div className="divide-y divide-border">
        {ranking.map((entry, i) => (
          <div
            key={entry.profileId}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5",
              entry.profileId === currentUser?.id && "bg-primary/5",
            )}
          >
            <span className="w-6 text-center font-bold text-sm">
              {i < 3 ? MEDALS[i] : `${i + 1}`}
            </span>
            <span className="text-lg">{entry.avatar}</span>
            <span className={cn(
              "flex-1 text-sm font-medium truncate",
              entry.profileId === currentUser?.id && "font-bold",
            )}>
              {entry.name}
            </span>
            <span className="text-sm font-bold text-primary">
              {entry.points} pts
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
