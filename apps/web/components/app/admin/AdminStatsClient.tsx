"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks, backfillInstances } from "@/lib/api/tasks";
import { fetchFamilyRewards, fetchFamilyClaims } from "@/lib/api/rewards";
import { fetchFamilyProfiles } from "@/lib/api/members";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, CheckCircle2, Gift, TrendingUp, Flame, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateCurrentStreak, COMPLETION_RATE_GOOD, COMPLETION_RATE_OK, STREAK_HIGHLIGHT_THRESHOLD } from "@/lib/config/constants";

export default function AdminStatsClient() {
  const t = useTranslations("admin.stats");
  const { users, tasks, taskInstances, claims, rewards, transactions } = useAppStore();

  useEffect(() => {
    (async () => {
      const [profiles, fetchedTasks, rewardsData, claimsData, txs] = await Promise.all([
        fetchFamilyProfiles(),
        fetchFamilyTasks(),
        fetchFamilyRewards(),
        fetchFamilyClaims(),
        fetchFamilyTransactions(),
      ]);
      useAppStore.setState({ users: profiles, tasks: fetchedTasks, rewards: rewardsData, claims: claimsData, transactions: txs });
      for (const u of profiles) {
        const instances = await backfillInstances(fetchedTasks, u.id, new Date());
        useAppStore.setState((prev) => ({
          taskInstances: [
            ...prev.taskInstances.filter((ti) => ti.userId !== u.id),
            ...instances,
          ],
        }));
      }
    })().catch(() => {});
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const members = users.filter((u) => u.role === "member");
  const allMembers = users;

  // ── Summary stats ──
  const totalPoints = allMembers.reduce((a, u) => a + u.pointsBalance, 0);
  const completedTotal = taskInstances.filter((ti) => ti.state === "completed").length;
  const failedTotal = taskInstances.filter((ti) => ti.state === "failed").length;
  const pendingClaims = claims.filter((c) => c.status === "pending");
  const approvedClaims = claims.filter((c) => c.status === "approved");

  // ── Ranking by points ──
  const ranking = useMemo(() =>
    [...allMembers].sort((a, b) => b.pointsBalance - a.pointsBalance),
    [allMembers]
  );
  const maxPoints = ranking.length > 0 ? ranking[0].pointsBalance : 0;

  // ── Streaks per member ──
  const streaks = useMemo(() => {
    return allMembers.map((user) => {
      const completedDates = new Set(
        taskInstances
          .filter((ti) => ti.userId === user.id && ti.state === "completed")
          .map((ti) => ti.date)
      );
      const streak = calculateCurrentStreak(completedDates);
      return { user, streak };
    }).sort((a, b) => b.streak - a.streak);
  }, [allMembers, taskInstances]);

  // ── Completion rate per member ──
  const completionRates = useMemo(() => {
    return allMembers.map((user) => {
      const instances = taskInstances.filter((ti) => ti.userId === user.id);
      const completed = instances.filter((ti) => ti.state === "completed").length;
      const total = instances.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      return { user, completed, total, rate };
    }).sort((a, b) => b.rate - a.rate);
  }, [allMembers, taskInstances]);

  // ── Top tasks (most completed) ──
  const topTasks = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ti of taskInstances) {
      if (ti.state === "completed") {
        counts[ti.taskId] = (counts[ti.taskId] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([taskId, count]) => ({ task: tasks.find((t) => t.id === taskId), count }))
      .filter((e) => e.task)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [taskInstances, tasks]);

  // ── Most failed tasks ──
  const worstTasks = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ti of taskInstances) {
      if (ti.state === "failed") {
        counts[ti.taskId] = (counts[ti.taskId] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([taskId, count]) => ({ task: tasks.find((t) => t.id === taskId), count }))
      .filter((e) => e.task)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [taskInstances, tasks]);

  // ── Most claimed rewards ──
  const topRewards = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of approvedClaims) {
      counts[c.rewardId] = (counts[c.rewardId] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([rewardId, count]) => ({ reward: rewards.find((r) => r.id === rewardId), count }))
      .filter((e) => e.reward)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [approvedClaims, rewards]);

  // ── Points earned this week ──
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const pointsThisWeek = useMemo(() => {
    return allMembers.map((user) => {
      const pts = taskInstances
        .filter((ti) => ti.userId === user.id && ti.date >= weekStartStr && ti.state === "completed")
        .reduce((a, ti) => a + ti.pointsAwarded, 0);
      return { user, pts };
    }).sort((a, b) => b.pts - a.pts);
  }, [allMembers, taskInstances, weekStartStr]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Star className="w-5 h-5 text-primary fill-primary" />}
          label={t("totalFamilyPoints")}
          value={totalPoints.toLocaleString()}
          bg="bg-orange-50"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label={t("completedTasks")}
          value={completedTotal}
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          label={t("failedTasks")}
          value={failedTotal}
          bg="bg-red-50"
        />
        <SummaryCard
          icon={<Gift className="w-5 h-5 text-blue-500" />}
          label={t("pendingClaims")}
          value={pendingClaims.length}
          bg="bg-blue-50"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ranking by points */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              {t("pointsRanking")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.map((user, i) => {
              const pct = maxPoints > 0 ? (user.pointsBalance / maxPoints) * 100 : 0;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              return (
                <div key={user.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-6 text-center">{medal}</span>
                      <span className="text-lg">{user.avatar}</span>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{user.pointsBalance.toLocaleString()} pts</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 ml-8">
                    <div
                      className="bg-gradient-to-r from-primary to-orange-400 h-2.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Completion rates */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {t("completionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completionRates.map(({ user, completed, total, rate }) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                  </div>
                  <Progress value={rate} className={cn("h-2", rate >= COMPLETION_RATE_GOOD ? "[&>div]:bg-green-500" : rate >= COMPLETION_RATE_OK ? "[&>div]:bg-amber-400" : "[&>div]:bg-red-400")} />
                </div>
                <span className={cn(
                  "text-sm font-bold w-12 text-right",
                  rate >= COMPLETION_RATE_GOOD ? "text-green-600" : rate >= COMPLETION_RATE_OK ? "text-amber-600" : "text-red-500"
                )}>
                  {Math.round(rate)}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Streaks */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              {t("currentStreaks")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {streaks.map(({ user, streak }) => (
              <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                <span className="text-xl">{user.avatar}</span>
                <span className="text-sm font-medium flex-1">{user.name}</span>
                <div className="flex items-center gap-1">
                  <Flame className={cn("w-4 h-4", streak >= STREAK_HIGHLIGHT_THRESHOLD ? "text-orange-500" : "text-muted-foreground/40")} />
                  <span className={cn("text-sm font-bold", streak >= STREAK_HIGHLIGHT_THRESHOLD ? "text-orange-600" : "text-muted-foreground")}>
                    {streak} {streak === 1 ? t("day") : t("days")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Points this week */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              {t("pointsThisWeek")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pointsThisWeek.map(({ user, pts }) => (
              <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40">
                <span className="text-xl">{user.avatar}</span>
                <span className="text-sm font-medium flex-1">{user.name}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-sm font-bold text-primary">+{pts}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top completed tasks */}
        {topTasks.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t("mostCompleted")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topTasks.map(({ task, count }, i) => (
                <div key={task!.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{i + 1}. {task!.title}</span>
                  <Badge variant="secondary" className="text-xs">{count}x</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Most failed tasks */}
        {worstTasks.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                {t("mostFailed")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {worstTasks.map(({ task, count }, i) => (
                <div key={task!.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{i + 1}. {task!.title}</span>
                  <Badge variant="secondary" className="text-xs text-red-600">{count}x</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Top rewards */}
        {topRewards.length > 0 && (
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-500" />
                {t("mostRedeemed")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topRewards.map(({ reward, count }) => (
                  <div key={reward!.id} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-xl text-sm">
                    <span>{reward!.emoji}</span>
                    <span className="font-medium">{reward!.title}</span>
                    <Badge variant="secondary" className="text-xs">{count}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, bg,
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
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
