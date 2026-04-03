"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  ACHIEVEMENTS,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  MOCK_USER_STATS,
  type AchievementCategory,
} from "@/lib/achievements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AchievementsClient() {
  const { currentUser } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");

  if (!currentUser) return null;

  const stats = MOCK_USER_STATS[currentUser.id] ?? {
    totalTasksCompleted: 0, currentStreak: 0, bestStreak: 0,
    totalPoints: 0, rewardsClaimed: 0, perfectWeeks: 0,
    totalPointsEarned: 0, daysActive: 0,
  };

  const unlocked = ACHIEVEMENTS.filter((a) => a.condition(stats));
  const locked = ACHIEVEMENTS.filter((a) => !a.condition(stats));
  const totalPoints = unlocked.reduce((acc, a) => acc + a.points, 0);

  const categories = Object.entries(CATEGORY_CONFIG) as [AchievementCategory, typeof CATEGORY_CONFIG[AchievementCategory]][];

  const filtered = ACHIEVEMENTS.filter(
    (a) => activeCategory === "all" || a.category === activeCategory
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Logros
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unlocked.length} de {ACHIEVEMENTS.length} desbloqueados
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2.5 rounded-2xl">
          <span className="text-3xl">🏅</span>
          <div>
            <p className="text-2xl font-extrabold text-primary leading-tight">{unlocked.length}</p>
            <p className="text-xs text-muted-foreground">logros</p>
          </div>
          <div className="w-px h-8 bg-primary/20" />
          <div>
            <p className="text-2xl font-extrabold text-primary leading-tight">+{totalPoints}</p>
            <p className="text-xs text-muted-foreground">pts bonus</p>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progreso general</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%
            </span>
          </div>
          <Progress value={(unlocked.length / ACHIEVEMENTS.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Racha actual", value: stats.currentStreak, suffix: "días", emoji: "🔥" },
          { label: "Mejor racha", value: stats.bestStreak, suffix: "días", emoji: "⚡" },
          { label: "Tareas totales", value: stats.totalTasksCompleted, suffix: "", emoji: "✅" },
          { label: "Sem. perfectas", value: stats.perfectWeeks, suffix: "", emoji: "🎯" },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl mb-1">{s.emoji}</p>
              <p className="text-xl font-extrabold text-foreground">{s.value}{s.suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{s.suffix}</span>}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category filter */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            🏆 Todos ({ACHIEVEMENTS.length})
          </button>
          {categories.map(([key, cat]) => {
            const count = ACHIEVEMENTS.filter((a) => a.category === key).length;
            const unlockedCount = unlocked.filter((a) => a.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  activeCategory === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.emoji} {cat.label} ({unlockedCount}/{count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((achievement) => {
          const isUnlocked = achievement.condition(stats);
          const rarity = RARITY_CONFIG[achievement.rarity];

          return (
            <Card
              key={achievement.id}
              className={cn(
                "border-2 transition-all shadow-sm",
                isUnlocked
                  ? cn(rarity.border, rarity.glow && `shadow-lg ${rarity.glow}`)
                  : "border-transparent opacity-50 grayscale"
              )}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0",
                    isUnlocked ? "bg-gradient-to-br from-primary/20 to-orange-100" : "bg-muted"
                  )}>
                    {isUnlocked ? achievement.emoji : <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="font-bold text-sm leading-tight">{achievement.title}</p>
                      <Badge className={cn("text-[10px] border-0 flex-shrink-0", rarity.color)}>
                        {rarity.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{achievement.description}</p>

                    {/* Points bonus */}
                    {achievement.points > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className={cn("w-3 h-3 fill-current", isUnlocked ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-semibold", isUnlocked ? "text-primary" : "text-muted-foreground")}>
                          +{achievement.points} pts bonus
                        </span>
                      </div>
                    )}

                    {/* Unlocked badge */}
                    {isUnlocked && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">Desbloqueado</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
