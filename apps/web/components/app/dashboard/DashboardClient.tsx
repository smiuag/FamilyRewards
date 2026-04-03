"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Star, TrendingUp, Flame, Gift, Trophy, MessageSquare, Zap, Flag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useParams } from "next/navigation";
import { ACHIEVEMENTS, MOCK_USER_STATS, RARITY_CONFIG } from "@/lib/achievements";
import { MOCK_BOARD_MESSAGES } from "@/lib/mock-data/board";
import { MOCK_USERS } from "@/lib/mock-data";
import { useChallengesStore } from "@/lib/store/useChallengesStore";
import { useMultipliersStore } from "@/lib/store/useMultipliersStore";

export default function DashboardClient() {
  const t = useTranslations("dashboard");
  const { currentUser, tasks, rewards, taskInstances, updateTaskInstance } = useAppStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

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

  // Achievements
  const stats = MOCK_USER_STATS[currentUser.id];
  const recentAchievements = stats
    ? ACHIEVEMENTS.filter((a) => a.condition(stats)).slice(-3).reverse()
    : [];

  // Board
  const recentBoardMessages = MOCK_BOARD_MESSAGES.slice(0, 2);

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
          <CardContent className="space-y-2">
            {recentBoardMessages.map((msg) => {
              const author = MOCK_USERS.find((u) => u.id === msg.userId);
              const isSystem = msg.userId === "system";
              return (
                <div key={msg.id} className="flex gap-2.5 p-2.5 rounded-xl bg-muted/40">
                  <div className="text-xl flex-shrink-0">
                    {isSystem ? msg.emoji : author?.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                      {isSystem ? "FamilyRewards" : author?.name}
                    </p>
                    <p className="text-sm text-foreground leading-snug line-clamp-2">
                      {msg.content.replace(/\*\*/g, "")}
                    </p>
                  </div>
                </div>
              );
            })}
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
