"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_TASKS, MOCK_REWARDS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Star, TrendingUp, Flame, Gift } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardClient() {
  const t = useTranslations("dashboard");
  const { currentUser, taskInstances, updateTaskInstance } = useAppStore();

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
  const nextReward = MOCK_REWARDS.filter(
    (r) => r.status === "available" && r.pointsCost > currentUser.pointsBalance
  ).sort((a, b) => a.pointsCost - b.pointsCost)[0];

  const progressToNextReward = nextReward
    ? Math.min(100, (currentUser.pointsBalance / nextReward.pointsCost) * 100)
    : 100;

  const formattedDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  // Map task instances to tasks for display
  const todayTasksWithInfo = todayInstances.slice(0, 4).map((ti) => {
    const task = MOCK_TASKS.find((t) => t.id === ti.taskId);
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
