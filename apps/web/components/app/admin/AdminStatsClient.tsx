"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks, backfillInstances } from "@/lib/api/tasks";
import { fetchFamilyRewards, fetchFamilyClaims } from "@/lib/api/rewards";
import { fetchFamilyProfiles } from "@/lib/api/members";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import { buildFamilyReport } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star, CheckCircle2, Gift, TrendingUp, Flame, Trophy, XCircle,
  Wallet, ArrowUpRight, ArrowDownRight, BarChart3, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateCurrentStreak, buildVacationDays, COMPLETION_RATE_GOOD, COMPLETION_RATE_OK, STREAK_HIGHLIGHT_THRESHOLD } from "@/lib/config/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Period = "week" | "month" | "all";

export default function AdminStatsClient() {
  const t = useTranslations("admin.stats");
  const { users, tasks, taskInstances, claims, rewards, transactions } = useAppStore();
  const [period, setPeriod] = useState<Period>("week");

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
  const allMembers = users;

  // ── Period-based report ──
  const report = useMemo(() => {
    if (period === "all") return null;
    return buildFamilyReport(allMembers, taskInstances, period, tasks);
  }, [allMembers, taskInstances, tasks, period]);

  // ── Date range for filtering ──
  const { startDate, endDate } = useMemo(() => {
    if (report) return { startDate: report.startDate, endDate: report.endDate };
    // "all" — use earliest instance date to today
    const dates = taskInstances.map((ti) => ti.date).sort();
    return { startDate: dates[0] ?? today, endDate: today };
  }, [report, taskInstances, today]);

  // ── Filtered instances for current period ──
  const periodInstances = useMemo(() => {
    if (period === "all") return taskInstances;
    return taskInstances.filter((ti) => ti.date >= startDate && ti.date <= endDate);
  }, [taskInstances, period, startDate, endDate]);

  // ── Summary stats (period-aware) ──
  const totalPoints = allMembers.reduce((a, u) => a + u.pointsBalance, 0);
  const completedTotal = periodInstances.filter((ti) => ti.state === "completed").length;
  const failedTotal = periodInstances.filter((ti) => ti.state === "failed").length;
  const pendingClaimsList = claims.filter((c) => c.status === "pending");

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
      const vacDays = buildVacationDays(user.vacationUntil);
      const streak = calculateCurrentStreak(completedDates, vacDays);
      return { user, streak };
    }).sort((a, b) => b.streak - a.streak);
  }, [allMembers, taskInstances]);

  // ── Completion rate per member (period-aware) ──
  const completionRates = useMemo(() => {
    return allMembers.map((user) => {
      const instances = periodInstances.filter((ti) => ti.userId === user.id);
      const completed = instances.filter((ti) => ti.state === "completed").length;
      const total = instances.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      return { user, completed, total, rate };
    }).sort((a, b) => b.rate - a.rate);
  }, [allMembers, periodInstances]);

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

  // ── Top tasks (most completed, period-aware) ──
  const topTasks = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ti of periodInstances) {
      if (ti.state === "completed") {
        counts[ti.taskId] = (counts[ti.taskId] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([taskId, count]) => ({ task: tasks.find((t) => t.id === taskId), count }))
      .filter((e) => e.task)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [periodInstances, tasks]);

  // ── Most failed tasks (period-aware) ──
  const worstTasks = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ti of periodInstances) {
      if (ti.state === "failed") {
        counts[ti.taskId] = (counts[ti.taskId] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([taskId, count]) => ({ task: tasks.find((t) => t.id === taskId), count }))
      .filter((e) => e.task)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [periodInstances, tasks]);

  // ── Most claimed rewards ──
  const approvedClaims = claims.filter((c) => c.status === "approved");
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

  // ── Family daily activity (from report or computed) ���─
  const dailyActivity = useMemo(() => {
    if (report) {
      // Aggregate daily breakdown across all members
      const dayMap: Record<string, { completed: number; failed: number; points: number }> = {};
      for (const mr of report.memberReports) {
        for (const day of mr.dailyBreakdown) {
          if (!dayMap[day.date]) dayMap[day.date] = { completed: 0, failed: 0, points: 0 };
          dayMap[day.date].completed += day.completed;
          dayMap[day.date].failed += day.failed;
          dayMap[day.date].points += day.points;
        }
      }
      return Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }));
    }
    return [];
  }, [report]);

  // ── Points economy (from transactions) ──
  const economy = useMemo(() => {
    const filtered = period === "all"
      ? transactions
      : transactions.filter((tx) => tx.createdAt.slice(0, 10) >= startDate && tx.createdAt.slice(0, 10) <= endDate);

    let earned = 0;
    let spent = 0;
    let adjustments = 0;
    let streakBonus = 0;

    for (const tx of filtered) {
      switch (tx.type) {
        case "task": earned += tx.amount; break;
        case "reward": spent += Math.abs(tx.amount); break;
        case "adjustment": adjustments += tx.amount; break;
        case "streak": streakBonus += tx.amount; break;
      }
    }
    return { earned, spent, adjustments, streakBonus, net: earned - spent + adjustments + streakBonus };
  }, [transactions, period, startDate, endDate]);

  // ── Claims summary ──
  const claimsSummary = useMemo(() => {
    const approved = claims.filter((c) => c.status === "approved").length;
    const rejected = claims.filter((c) => c.status === "rejected").length;
    const pending = claims.filter((c) => c.status === "pending").length;
    const total = approved + rejected;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { approved, rejected, pending, approvalRate };
  }, [claims]);

  const DAY_LABELS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with period toggle */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t("title")}</h1>
          {report && (
            <p className="text-muted-foreground text-sm mt-0.5 capitalize">
              {format(new Date(report.startDate + "T12:00:00"), "d MMM", { locale: es })} — {format(new Date(report.endDate + "T12:00:00"), "d MMM yyyy", { locale: es })}
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                period === p ? "bg-primary text-primary-foreground" : "hover:bg-background"
              )}
            >
              {t(`period${p.charAt(0).toUpperCase() + p.slice(1)}` as "periodWeek" | "periodMonth" | "periodAll")}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Star className="w-5 h-5 text-primary fill-primary" />}
          label={t("totalFamilyPoints")}
          value={totalPoints.toLocaleString()}
          bg="bg-orange-50 dark:bg-orange-950/30"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label={t("completedTasks")}
          value={completedTotal}
          bg="bg-green-50 dark:bg-green-950/30"
        />
        <SummaryCard
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          label={t("failedTasks")}
          value={failedTotal}
          bg="bg-red-50 dark:bg-red-950/30"
        />
        <SummaryCard
          icon={<Gift className="w-5 h-5 text-blue-500" />}
          label={t("pendingClaims")}
          value={pendingClaimsList.length}
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
      </div>

      {/* Family daily activity chart */}
      {dailyActivity.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {t("familyActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-32">
              {dailyActivity.map((day) => {
                const maxCompleted = Math.max(...dailyActivity.map((d) => d.completed), 1);
                const heightPct = (day.completed / maxCompleted) * 100;
                const isToday = day.date === today;
                const dayOfWeek = new Date(day.date + "T12:00:00").getDay();
                const label = DAY_LABELS_SHORT[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground font-medium">{day.completed > 0 ? day.completed : ""}</span>
                    <div className="w-full flex flex-col justify-end h-20">
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all min-h-[2px]",
                          isToday ? "bg-primary" : "bg-primary/30"
                        )}
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                        title={`${day.date}: ${day.completed} completadas, ${day.points} pts`}
                      />
                    </div>
                    <span className={cn(
                      "text-[10px]",
                      isToday ? "font-bold text-primary" : "text-muted-foreground"
                    )}>
                      {dailyActivity.length <= 7
                        ? label
                        : (parseInt(day.date.slice(-2)) % 5 === 1 || isToday) ? day.date.slice(-2) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Economy + Claims row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Points economy */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              {t("pointsEconomy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span>{t("earned")}</span>
              </div>
              <span className="text-sm font-bold text-green-600">+{economy.earned.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <ArrowDownRight className="w-4 h-4 text-red-400" />
                <span>{t("spent")}</span>
              </div>
              <span className="text-sm font-bold text-red-500">-{economy.spent.toLocaleString()}</span>
            </div>
            {economy.adjustments !== 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>{t("adjustments")}</span>
                </div>
                <span className={cn("text-sm font-bold", economy.adjustments >= 0 ? "text-amber-600" : "text-red-500")}>
                  {economy.adjustments >= 0 ? "+" : ""}{economy.adjustments.toLocaleString()}
                </span>
              </div>
            )}
            {economy.streakBonus > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{t("streakBonus")}</span>
                </div>
                <span className="text-sm font-bold text-orange-600">+{economy.streakBonus.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("netBalance")}</span>
              <span className={cn("text-lg font-extrabold", economy.net >= 0 ? "text-green-600" : "text-red-500")}>
                {economy.net >= 0 ? "+" : ""}{economy.net.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Claims summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-500" />
              {t("claimsSummary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
                <p className="text-2xl font-extrabold text-green-600">{claimsSummary.approved}</p>
                <p className="text-xs text-muted-foreground">{t("approved")}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
                <p className="text-2xl font-extrabold text-red-500">{claimsSummary.rejected}</p>
                <p className="text-xs text-muted-foreground">{t("rejected")}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
                <p className="text-2xl font-extrabold text-amber-600">{claimsSummary.pending}</p>
                <p className="text-xs text-muted-foreground">{t("pending")}</p>
              </div>
            </div>
            {(claimsSummary.approved + claimsSummary.rejected) > 0 && (
              <div className="flex items-center gap-3">
                <Progress
                  value={claimsSummary.approvalRate}
                  className={cn("h-2.5 flex-1", claimsSummary.approvalRate >= 80 ? "[&>div]:bg-green-500" : claimsSummary.approvalRate >= 50 ? "[&>div]:bg-amber-400" : "[&>div]:bg-red-400")}
                />
                <span className="text-sm font-bold w-16 text-right">{claimsSummary.approvalRate}%</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">{t("approvalRate")}</p>
          </CardContent>
        </Card>
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

        {/* Completion rates (period-aware) */}
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
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl flex-shrink-0">
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
                  <div key={reward!.id} className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-xl text-sm">
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

      {/* Per-member detail table (period-aware) */}
      {report && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {t("memberDetail")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 font-medium">{t("member")}</th>
                    <th className="text-right pb-2 font-medium">{t("completed")}</th>
                    <th className="text-right pb-2 font-medium">{t("failed")}</th>
                    <th className="text-right pb-2 font-medium">{t("rate")}</th>
                    <th className="text-right pb-2 font-medium">{t("points")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.memberReports
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .map((r) => (
                      <tr key={r.user.id}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span>{r.user.avatar}</span>
                            <span className="font-medium">{r.user.name}</span>
                            {r.user.id === report.bestMemberId && (
                              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="text-right py-2.5 text-green-600 font-semibold">{r.totalCompleted}</td>
                        <td className="text-right py-2.5 text-muted-foreground">{r.totalFailed}</td>
                        <td className="text-right py-2.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            r.completionRate >= COMPLETION_RATE_GOOD ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : r.completionRate >= COMPLETION_RATE_OK ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          )}>
                            {r.completionRate}%
                          </span>
                        </td>
                        <td className="text-right py-2.5 font-bold text-primary">{r.totalPoints}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
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
