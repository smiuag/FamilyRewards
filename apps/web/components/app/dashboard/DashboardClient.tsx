"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchBoardMessages } from "@/lib/api/board";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import type { BoardMessage } from "@/lib/api/board";
import type { PointsTransaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Star, TrendingUp, Flame, Gift, Trophy, MessageSquare, Zap, Flag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS, RARITY_CONFIG } from "@/lib/achievements";
import { useChallengesStore } from "@/lib/store/useChallengesStore";
import { useMultipliersStore } from "@/lib/store/useMultipliersStore";

export default function DashboardClient() {
  const t = useTranslations("dashboard");
  const { currentUser, users, tasks, rewards, taskInstances, claims, transactions, updateTaskInstance } = useAppStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  // Feed del tablón: mensajes + transacciones recientes
  const [feedItems, setFeedItems] = useState<Array<{ id: string; type: "board" | "tx"; createdAt: string; content: string; emoji?: string; userName?: string; amount?: number }>>([]);

  useEffect(() => {
    if (!currentUser) return;
    async function loadFeed() {
      try {
        const [msgs, txs] = await Promise.all([
          fetchBoardMessages(10),
          fetchFamilyTransactions(),
        ]);
        const allUsers = useAppStore.getState().users;
        const boardItems = msgs.slice(0, 5).map((m: BoardMessage) => {
          const author = allUsers.find((u) => u.id === m.profileId);
          return {
            id: m.id,
            type: "board" as const,
            createdAt: m.createdAt,
            content: m.content,
            userName: author?.name ?? "Sistema",
            emoji: author?.avatar,
          };
        });
        const txItems = txs.slice(0, 5).map((tx: PointsTransaction) => {
          const u = allUsers.find((u) => u.id === tx.userId);
          return {
            id: tx.id,
            type: "tx" as const,
            createdAt: tx.createdAt,
            content: tx.description,
            userName: u?.name ?? "Usuario",
            emoji: tx.emoji,
            amount: tx.amount,
          };
        });
        const combined = [...boardItems, ...txItems]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5);
        setFeedItems(combined);
      } catch {}
    }
    loadFeed();
  }, [currentUser]);

  if (!currentUser) return null;

  const today = new Date().toISOString().split("T")[0];

  // Get today's task instances for current user
  const todayInstances = taskInstances.filter(
    (ti) => ti.userId === currentUser.id && ti.date === today
  );

  const completedToday = todayInstances.filter((ti) => ti.state === "completed");
  const pendingToday = todayInstances.filter((ti) => ti.state === "pending");
  const pointsToday = completedToday.reduce((acc, ti) => acc + ti.pointsAwarded, 0);

  // Find next affordable reward
  const nextReward = rewards.filter(
    (r) => r.status === "available" && r.pointsCost > currentUser.pointsBalance
  ).sort((a, b) => a.pointsCost - b.pointsCost)[0];

  const progressToNextReward = nextReward
    ? Math.min(100, (currentUser.pointsBalance / nextReward.pointsCost) * 100)
    : 100;

  const formattedDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  // Challenges & multipliers
  const { challenges } = useChallengesStore();
  const { multipliers } = useMultipliersStore();
  const activeChallenges = challenges.filter((c) => c.status === "active").slice(0, 2);
  const activeMultiplier = multipliers.find(
    (m) => m.isActive && m.startDate <= today && m.endDate >= today
  );

  // Achievements — computed from real data
  const stats = useMemo(() => {
    const myInstances = taskInstances.filter((ti) => ti.userId === currentUser.id);
    const completed = myInstances.filter((ti) => ti.state === "completed");
    const totalPointsEarned = completed.reduce((s, ti) => s + ti.pointsAwarded, 0);
    const completedDays = new Set(completed.map((ti) => ti.date));
    let currentStreak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      if (completedDays.has(ds)) { currentStreak++; } else if (i > 0) { break; }
    }
    const rewardsClaimed = claims.filter((c) => c.userId === currentUser.id && c.status === "approved").length;
    return {
      totalTasksCompleted: completed.length, currentStreak, bestStreak: currentStreak,
      totalPoints: currentUser.pointsBalance, rewardsClaimed, perfectWeeks: 0,
      totalPointsEarned, daysActive: completedDays.size,
    };
  }, [currentUser, taskInstances, claims, transactions]);

  const recentAchievements = ACHIEVEMENTS.filter((a) => a.condition(stats)).slice(-3).reverse();

  // Map task instances to tasks for display
  const todayTasksWithInfo = todayInstances.slice(0, 4).map((ti) => {
    const task = tasks.find((t) => t.id === ti.taskId);
    return { instance: ti, task };
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">
          {t("greeting", { name: currentUser.name })}
        </h1>
        <p className="text-muted-foreground capitalize">{formattedDate}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          label={t("tasksPending")}
          value={pendingToday.length}
          bg="bg-amber-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label={t("tasksCompleted")}
          value={completedToday.length}
          bg="bg-green-50"
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-primary fill-primary" />}
          label={t("pointsToday")}
          value={`+${pointsToday}`}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label={t("pointsTotal")}
          value={currentUser.pointsBalance.toLocaleString()}
          bg="bg-blue-50"
        />
      </div>

      {/* Active multiplier banner */}
      {activeMultiplier && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
          <span className="text-2xl">{activeMultiplier.emoji}</span>
          <div className="flex-1">
            <p className="font-bold text-primary">
              ×{activeMultiplier.multiplier} activo — {activeMultiplier.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeMultiplier.description} · Hasta {activeMultiplier.endDate}
            </p>
          </div>
          <Zap className="w-5 h-5 text-primary" />
        </div>
      )}

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flag className="w-4 h-4 text-primary" />
                Retos activos
              </CardTitle>
              <button
                onClick={() => router.push(`/${locale}/challenges`)}
                className="text-xs text-primary hover:underline"
              >
                Ver todos →
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeChallenges.map((c) => {
              const pct = Math.min(100, (c.currentProgress / c.goalTarget) * 100);
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{c.emoji}</span>
                      {c.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t("todayTasks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasksWithInfo.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                {t("noTasksToday")}
              </p>
            ) : (
              todayTasksWithInfo.map(({ instance, task }) => (
                <div
                  key={instance.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="text-xl">{instance.state === "completed" ? "✅" : "⏰"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task?.title ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">+{task?.points ?? 0} pts</p>
                  </div>
                  {instance.state === "pending" && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => updateTaskInstance(instance.id, "completed")}
                    >
                      {t("quickComplete")}
                    </Button>
                  )}
                  {instance.state === "completed" && (
                    <Badge variant="secondary" className="text-green-600 bg-green-100 border-0 text-xs">
                      ✓ Hecho
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Next reward progress */}
        <div className="space-y-4">
          {nextReward && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  {t("nextReward")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl">
                    {nextReward.emoji}
                  </div>
                  <div>
                    <p className="font-semibold">{nextReward.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("pointsProgress", {
                        current: currentUser.pointsBalance.toLocaleString(),
                        needed: nextReward.pointsCost.toLocaleString(),
                      })}
                    </p>
                  </div>
                </div>
                <Progress value={progressToNextReward} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  Te faltan{" "}
                  <span className="font-semibold text-primary">
                    {(nextReward.pointsCost - currentUser.pointsBalance).toLocaleString()} pts
                  </span>{" "}
                  para esta recompensa
                </p>
              </CardContent>
            </Card>
          )}

          {/* Weekly streak */}
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground">7 días</p>
                  <p className="text-sm text-muted-foreground">{t("streakDays", { days: 7 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row: achievements + board preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent achievements */}
        {recentAchievements.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Logros recientes
                </CardTitle>
                <button
                  onClick={() => router.push(`/${locale}/achievements`)}
                  className="text-xs text-primary hover:underline"
                >
                  Ver todos →
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentAchievements.map((a) => {
                const rarity = RARITY_CONFIG[a.rarity];
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                    <div className="text-2xl">{a.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${rarity.color}`}>
                      {rarity.label}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Board preview */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Tablón familiar
              </CardTitle>
              <button
                onClick={() => router.push(`/${locale}/board`)}
                className="text-xs text-primary hover:underline"
              >
                Ver todo →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {feedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">El tablón está vacío</p>
                <button
                  onClick={() => router.push(`/${locale}/board`)}
                  className="text-xs text-primary hover:underline"
                >
                  Sé el primero en escribir →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {feedItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">{item.emoji ?? "💬"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{item.userName}</span>
                        {" "}
                        <span className="text-muted-foreground">
                          {item.type === "tx" ? item.content : item.content}
                        </span>
                      </p>
                    </div>
                    {item.amount != null && (
                      <span className={cn(
                        "text-xs font-bold flex-shrink-0",
                        item.amount > 0 ? "text-green-600" : "text-orange-500"
                      )}>
                        {item.amount > 0 ? "+" : ""}{item.amount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5">
        <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>{icon}</div>
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
