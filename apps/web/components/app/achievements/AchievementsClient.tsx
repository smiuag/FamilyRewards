"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks, backfillInstances } from "@/lib/api/tasks";
import { fetchFamilyRewards, fetchFamilyClaims } from "@/lib/api/rewards";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import { fetchBoardStats } from "@/lib/api/board";
import { fetchPlayerResults } from "@/lib/api/minigame";
import {
  ACHIEVEMENTS,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  type AchievementCategory,
  type UserStats,
} from "@/lib/achievements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Lock, Trophy } from "lucide-react";
import { getLevelForAchievementCount, getNextLevel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import { PointsLink } from "@/components/ui/points-link";
import { calculateCurrentStreak, buildVacationDays } from "@/lib/config/constants";

export default function AchievementsClient() {
  const t = useTranslations("achievements");
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser, taskInstances, claims, transactions, rewards } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [boardStats, setBoardStats] = useState({ messagesPosted: 0, reactionsGiven: 0, reactionsReceived: 0, maxDistinctEmojisOnOneMessage: 0 });
  const [mgStats, setMgStats] = useState({ minigamesPlayed: 0, perfectMinigames: 0, bestTimeEasy: null as number | null, bestTimeHard: null as number | null });

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      let t = useAppStore.getState().tasks;
      if (t.length === 0) {
        t = await fetchFamilyTasks();
        useAppStore.setState({ tasks: t });
      }
      const [instances, claimsData, txs, bStats, mgResults] = await Promise.all([
        backfillInstances(t, currentUser.id, new Date()),
        fetchFamilyClaims().catch(() => []),
        fetchFamilyTransactions().catch(() => []),
        fetchBoardStats(currentUser.id).catch(() => ({ messagesPosted: 0, reactionsGiven: 0, reactionsReceived: 0, maxDistinctEmojisOnOneMessage: 0 })),
        fetchPlayerResults(currentUser.id, 500).catch(() => []),
      ]);
      setBoardStats(bStats);

      // Compute minigame stats
      const easyTimes = mgResults.filter((r) => r.difficulty === "easy").map((r) => r.timeSeconds);
      const hardTimes = mgResults.filter((r) => r.difficulty === "hard").map((r) => r.timeSeconds);
      setMgStats({
        minigamesPlayed: mgResults.length,
        perfectMinigames: mgResults.filter((r) => r.perfect).length,
        bestTimeEasy: easyTimes.length > 0 ? Math.min(...easyTimes) : null,
        bestTimeHard: hardTimes.length > 0 ? Math.min(...hardTimes) : null,
      });
      useAppStore.setState((prev) => ({
        taskInstances: [
          ...prev.taskInstances.filter((ti) => ti.userId !== currentUser.id),
          ...instances,
        ],
        claims: claimsData,
        transactions: txs,
      }));
    })().catch(() => {});
  }, [currentUser?.id]);

  const stats = useMemo<UserStats>(() => {
    if (!currentUser) return {
      totalTasksCompleted: 0, currentStreak: 0, bestStreak: 0,
      totalPoints: 0, rewardsClaimed: 0, perfectWeeks: 0,
      totalPointsEarned: 0, daysActive: 0,
      hasEarlyCompletion: false, maxRewardCost: 0,
      boardMessagesPosted: 0, reactionsGiven: 0, reactionsReceived: 0,
      maxDistinctEmojisOnOneMessage: 0, hasClaimedTask: false,
      minigamesPlayed: 0, perfectMinigames: 0, bestTimeEasy: null, bestTimeHard: null,
    };

    const myInstances = taskInstances.filter((ti) => ti.userId === currentUser.id);
    const completed = myInstances.filter((ti) => ti.state === "completed");
    const totalPointsEarned = completed.reduce((s, ti) => s + ti.pointsAwarded, 0);

    // Streak: count consecutive days (ending today) with at least one completed task
    const completedDays = new Set(completed.map((ti) => ti.date));
    const vacationDays = buildVacationDays(currentUser.vacationUntil);
    const currentStreak = calculateCurrentStreak(completedDays, vacationDays);

    // Best streak: find max consecutive days
    const sortedDays = Array.from(completedDays).sort();
    let bestStreak = 0;
    let runStreak = 0;
    let prevDate: Date | null = null;
    for (const ds of sortedDays) {
      const d = new Date(ds);
      if (prevDate) {
        const diff = (d.getTime() - prevDate.getTime()) / 86400000;
        runStreak = diff === 1 ? runStreak + 1 : 1;
      } else {
        runStreak = 1;
      }
      bestStreak = Math.max(bestStreak, runStreak);
      prevDate = d;
    }

    // Perfect weeks: weeks where all days Mon-Sun had at least one completion
    // Simplified: count weeks in completedDays that have all 7 days
    const weekSets: Record<string, Set<string>> = {};
    for (const ds of completedDays) {
      const d = new Date(ds);
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diff);
      const weekKey = monday.toISOString().split("T")[0];
      if (!weekSets[weekKey]) weekSets[weekKey] = new Set();
      weekSets[weekKey].add(ds);
    }
    const perfectWeeks = Object.values(weekSets).filter((s) => s.size === 7).length;

    const approvedClaims = claims.filter(
      (c) => c.userId === currentUser.id && c.status === "approved"
    );
    const rewardsClaimed = approvedClaims.length;

    // Max reward cost from approved claims
    const maxRewardCost = approvedClaims.reduce((max, c) => {
      const reward = rewards.find((r) => r.id === c.rewardId);
      return reward ? Math.max(max, reward.pointsCost) : max;
    }, 0);

    // Early bird: any task-type transaction created before 8am
    const myTaskTxs = transactions.filter(
      (tx) => tx.userId === currentUser.id && tx.type === "task" && tx.amount > 0
    );
    const hasEarlyCompletion = myTaskTxs.some((tx) => {
      const hour = new Date(tx.createdAt).getHours();
      return hour < 8;
    });

    const daysActive = completedDays.size;

    // Claimed task: user completed a task that has no assignments
    const tasks = useAppStore.getState().tasks;
    const hasClaimedTask = completed.some((ti) => {
      const task = tasks.find((t) => t.id === ti.taskId);
      return task && task.assignedTo.length === 0;
    });

    return {
      totalTasksCompleted: completed.length,
      currentStreak,
      bestStreak: Math.max(currentStreak, bestStreak),
      totalPoints: currentUser.pointsBalance,
      rewardsClaimed,
      perfectWeeks,
      totalPointsEarned,
      daysActive,
      hasEarlyCompletion,
      maxRewardCost,
      boardMessagesPosted: boardStats.messagesPosted,
      reactionsGiven: boardStats.reactionsGiven,
      reactionsReceived: boardStats.reactionsReceived,
      maxDistinctEmojisOnOneMessage: boardStats.maxDistinctEmojisOnOneMessage,
      hasClaimedTask,
      minigamesPlayed: mgStats.minigamesPlayed,
      perfectMinigames: mgStats.perfectMinigames,
      bestTimeEasy: mgStats.bestTimeEasy,
      bestTimeHard: mgStats.bestTimeHard,
    };
  }, [currentUser, taskInstances, claims, transactions, rewards, boardStats, mgStats]);

  if (!currentUser) return null;

  const unlocked = ACHIEVEMENTS.filter((a) => a.condition(stats));
  const locked = ACHIEVEMENTS.filter((a) => !a.condition(stats));
  const totalPoints = unlocked.reduce((acc, a) => acc + a.points, 0);
  const currentLevel = getLevelForAchievementCount(unlocked.length);

  // Persist count in store so TopBar can read it without importing ACHIEVEMENTS
  useEffect(() => {
    useAppStore.setState({ achievementCount: unlocked.length });
  }, [unlocked.length]);
  const nextLevel = getNextLevel(currentLevel);
  const levelTitle = locale === "en" ? currentLevel.titleEn : currentLevel.titleEs;

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
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("unlockedCount", { unlocked: unlocked.length, total: ACHIEVEMENTS.length })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2.5 rounded-2xl">
          <span className="text-3xl">🏅</span>
          <div>
            <p className="text-2xl font-extrabold text-primary leading-tight">{unlocked.length}</p>
            <p className="text-xs text-muted-foreground">{t("achievementsLabel")}</p>
          </div>
          <div className="w-px h-8 bg-primary/20" />
          <div>
            <PointsLink className="text-2xl font-extrabold text-primary leading-tight hover:underline">+{totalPoints}</PointsLink>
            <p className="text-xs text-muted-foreground">{t("bonusLabel")}</p>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t("overallProgress")}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%
            </span>
          </div>
          <Progress value={(unlocked.length / ACHIEVEMENTS.length) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Level card */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentLevel.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold">{t("level")} {currentLevel.level} — {levelTitle}</p>
              {nextLevel ? (
                <div className="mt-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{unlocked.length} / {nextLevel.minAchievements} {t("achievementsForNext")}</span>
                    <span>{locale === "en" ? nextLevel.titleEn : nextLevel.titleEs}</span>
                  </div>
                  <Progress value={(unlocked.length / nextLevel.minAchievements) * 100} className="h-2" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">{t("maxLevel")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("currentStreak"), value: stats.currentStreak, suffix: t("days"), emoji: "🔥" },
          { label: t("bestStreak"), value: stats.bestStreak, suffix: t("days"), emoji: "⚡" },
          { label: t("totalTasks"), value: stats.totalTasksCompleted, suffix: "", emoji: "✅" },
          { label: t("perfectWeeks"), value: stats.perfectWeeks, suffix: "", emoji: "🎯" },
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
            🏆 {t("allCategory")} ({ACHIEVEMENTS.length})
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
                        <PointsLink className={cn("text-xs font-semibold hover:underline", isUnlocked ? "text-primary" : "text-muted-foreground")}>
                          +{achievement.points} pts bonus
                        </PointsLink>
                      </div>
                    )}

                    {/* Unlocked badge */}
                    {isUnlocked && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">{t("unlocked")}</span>
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
