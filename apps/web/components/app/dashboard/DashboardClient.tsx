"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAnnounce } from "@/components/AriaLiveAnnouncer";
import { fetchBoardMessages, fetchReactions, toggleReaction } from "@/lib/api/board";
import type { BoardMessage, Reaction } from "@/lib/api/board";
import { fetchFamilyTransactions } from "@/lib/api/transactions";
import { fetchFamilyTasks, backfillInstances, syncInstanceState, claimTask } from "@/lib/api/tasks";
import type { PointsTransaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Star, TrendingUp, Flame, Gift, Trophy, MessageSquare, Zap, Flag, Hand, Heart, ChevronLeft, ChevronRight, Pin, SmilePlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ACHIEVEMENTS, RARITY_CONFIG } from "@/lib/achievements";
import { calculateCurrentStreak } from "@/lib/config/constants";
import { useChallengesStore } from "@/lib/store/useChallengesStore";
import { useMultipliersStore } from "@/lib/store/useMultipliersStore";

export default function DashboardClient() {
  const t = useTranslations("dashboard");
  const { currentUser, users, tasks, rewards, taskInstances, claims, transactions, updateTaskInstance, targetRewardIds } = useAppStore();
  const announce = useAnnounce();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  // Feed del tablón: mensajes + transacciones recientes
  const [feedItems, setFeedItems] = useState<Array<{ id: string; type: "board" | "tx"; createdAt: string; content: string; userName?: string; amount?: number }>>([]);
  const [pinnedItems, setPinnedItems] = useState<Array<{ id: string; content: string; userName: string }>>([]);
  const [boardReactions, setBoardReactions] = useState<Reaction[]>([]);
  const [allItemIds, setAllItemIds] = useState<string[]>([]);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [targetRewardIdx, setTargetRewardIdx] = useState(0);

  // Load tasks, instances, feed
  useEffect(() => {
    if (!currentUser) return;
    async function loadAll() {
      try {
        // Always fetch fresh tasks + backfill instances for today
        const activeTasks = await fetchFamilyTasks();
        useAppStore.setState({ tasks: activeTasks });
        const instances = await backfillInstances(activeTasks, currentUser!.id, new Date());
        useAppStore.setState((prev) => ({
          taskInstances: [
            ...prev.taskInstances.filter((ti) => ti.userId !== currentUser!.id),
            ...instances,
          ],
        }));

        // Load feed
        const [msgs, txs] = await Promise.all([
          fetchBoardMessages(10),
          fetchFamilyTransactions(),
        ]);
        const allUsers = useAppStore.getState().users;
        // Fetch reactions for all board messages and transactions
        const itemIds = [...msgs.map((m: BoardMessage) => m.id), ...txs.map((tx: PointsTransaction) => tx.id)];
        const rxns = itemIds.length > 0 ? await fetchReactions(itemIds) : [];
        setBoardReactions(rxns);
        setAllItemIds(itemIds);
        // Pinned messages for top of board section
        const pinned = msgs.filter((m: BoardMessage) => m.pinned).map((m: BoardMessage) => {
          const author = allUsers.find((u) => u.id === m.profileId);
          return { id: m.id, content: m.content, userName: author?.name ?? t("systemUser") };
        });
        setPinnedItems(pinned);
        const boardItems = msgs.filter((m: BoardMessage) => !m.pinned).slice(0, 5).map((m: BoardMessage) => {
          const author = allUsers.find((u) => u.id === m.profileId);
          return {
            id: m.id,
            type: "board" as const,
            createdAt: m.createdAt,
            content: m.content,
            userName: author?.name ?? t("systemUser"),
          };
        });
        const txItems = txs.slice(0, 5).map((tx: PointsTransaction) => {
          const u = allUsers.find((u_: typeof allUsers[number]) => u_.id === tx.userId);
          return {
            id: tx.id,
            type: "tx" as const,
            createdAt: tx.createdAt,
            content: tx.description,
            userName: u?.name ?? t("unknownUser"),
            amount: tx.amount,
          };
        });
        const combined = [...boardItems, ...txItems]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5);
        setFeedItems(combined);
      } catch {}
    }
    loadAll();
  }, [currentUser]);

  // Group reactions by item ID for rendering
  const getGroupedReactions = useCallback((itemId: string) => {
    const itemReactions = boardReactions.filter((r) => r.messageId === itemId);
    const grouped: Record<string, { count: number; profileIds: string[] }> = {};
    for (const r of itemReactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, profileIds: [] };
      grouped[r.emoji].count++;
      grouped[r.emoji].profileIds.push(r.profileId);
    }
    return grouped;
  }, [boardReactions]);

  const handleToggleReaction = async (itemId: string, emoji: string) => {
    if (!currentUser) return;
    const existing = boardReactions.find(
      (r) => r.messageId === itemId && r.profileId === currentUser.id && r.emoji === emoji
    );
    if (existing) {
      setBoardReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      setBoardReactions((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        messageId: itemId,
        profileId: currentUser.id,
        emoji,
        createdAt: new Date().toISOString(),
      }]);
    }
    try {
      await toggleReaction({ messageId: itemId, profileId: currentUser.id, emoji });
      const rxns = await fetchReactions(allItemIds);
      setBoardReactions(rxns);
    } catch {
      const rxns = await fetchReactions(allItemIds);
      setBoardReactions(rxns);
    }
  };

  if (!currentUser) return null;

  const today = new Date().toISOString().split("T")[0];

  // Get today's tasks using the same logic as TasksClient
  const dow = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()] as import("@/lib/types").DayOfWeek;
  const myTodayTasks = tasks.filter((t) => {
    if (!t.isActive) return false;
    if (!t.assignedTo.includes(currentUser.id) && t.assignedTo.length > 0) return false;
    if (t.isRecurring) return (t.recurringPattern?.daysOfWeek ?? []).includes(dow);
    const created = t.createdAt.slice(0, 10);
    if (today < created) return false;
    if (t.deadline && today > t.deadline) return false;
    return true;
  });

  // Match each task with its instance
  const todayInstances = myTodayTasks
    .filter((t) => t.assignedTo.includes(currentUser.id))
    .map((t) => taskInstances.find((ti) =>
      ti.taskId === t.id && ti.userId === currentUser.id && ti.date === today
    ))
    .filter((ti): ti is NonNullable<typeof ti> => !!ti);

  const completedToday = todayInstances.filter((ti) => ti.state === "completed");
  const pendingToday = todayInstances.filter((ti) => ti.state === "pending");
  // Points today: sum positive transactions for this user created today
  const pointsToday = transactions
    .filter((tx) => tx.userId === currentUser.id && tx.amount > 0 && tx.createdAt.startsWith(today))
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Target rewards (user's objectives)
  const targetRewards = rewards.filter(
    (r) => r.status === "available" && targetRewardIds.includes(r.id)
  );
  const safeIdx = targetRewards.length > 0 ? targetRewardIdx % targetRewards.length : 0;
  const currentTargetReward = targetRewards[safeIdx] ?? null;

  const progressToTargetReward = currentTargetReward
    ? Math.min(100, (currentUser.pointsBalance / currentTargetReward.pointsCost) * 100)
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
    const currentStreak = calculateCurrentStreak(completedDays);
    const rewardsClaimed = claims.filter((c) => c.userId === currentUser.id && c.status === "approved").length;
    return {
      totalTasksCompleted: completed.length, currentStreak, bestStreak: currentStreak,
      totalPoints: currentUser.pointsBalance, rewardsClaimed, perfectWeeks: 0,
      totalPointsEarned, daysActive: completedDays.size,
      hasEarlyCompletion: false, maxRewardCost: 0,
      boardMessagesPosted: 0, reactionsGiven: 0, reactionsReceived: 0,
      maxDistinctEmojisOnOneMessage: 0, hasClaimedTask: false,
    };
  }, [currentUser, taskInstances, claims, transactions]);

  const recentAchievements = ACHIEVEMENTS.filter((a) => a.condition(stats)).slice(-3).reverse();

  // Build task list for today — same logic as TasksClient
  const MAX_DASHBOARD_TASKS = 6;
  const allTodayTasksWithInfo: Array<{ instance: (typeof todayInstances)[0] | null; task: (typeof tasks)[0] | undefined; isClaimable: boolean }> = [];

  // Assigned tasks with instances
  for (const t of myTodayTasks.filter((t) => t.assignedTo.includes(currentUser.id))) {
    const instance = taskInstances.find((ti) =>
      ti.taskId === t.id && ti.userId === currentUser.id &&
      (t.isRecurring ? ti.date === today : true)
    ) ?? null;
    allTodayTasksWithInfo.push({ instance, task: t, isClaimable: false });
  }

  // Claimable tasks (unassigned)
  for (const t of myTodayTasks.filter((t) => t.assignedTo.length === 0)) {
    const claimed = taskInstances.some((ti) => ti.taskId === t.id && ti.date === today);
    if (!claimed) {
      allTodayTasksWithInfo.push({ instance: null, task: t, isClaimable: true });
    }
  }

  const todayTasksWithInfo = allTodayTasksWithInfo.slice(0, MAX_DASHBOARD_TASKS);
  const hasMoreTasks = allTodayTasksWithInfo.length > MAX_DASHBOARD_TASKS;

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
              {t("multiplierActive", { multiplier: activeMultiplier.multiplier, name: activeMultiplier.name })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("multiplierUntil", { description: activeMultiplier.description, endDate: activeMultiplier.endDate })}
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
                {t("activeChallenges")}
              </CardTitle>
              <button
                onClick={() => router.push(`/${locale}/challenges`)}
                className="text-xs text-primary hover:underline"
              >
                {t("viewAll")}
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
              todayTasksWithInfo.map(({ instance, task, isClaimable }) => (
                <div
                  key={isClaimable ? `claim-${task?.id}` : instance?.id ?? task?.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <div className="text-xl">
                    {isClaimable ? "🙋" : instance?.state === "completed" ? "✅" : "⏰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task?.title ?? "—"}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">+{task?.points ?? 0} pts</p>
                      {isClaimable && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5 py-0">
                          {t("unassigned")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isClaimable ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-amber-500 hover:bg-amber-600"
                      disabled={claimingTaskId === task?.id}
                      onClick={async () => {
                        if (!task || !currentUser) return;
                        setClaimingTaskId(task.id);
                        try {
                          const newInstance = await claimTask(task, currentUser.id, today);
                          if (!newInstance) {
                            toast.error(t("claimAlreadyTaken"));
                            return;
                          }
                          useAppStore.setState((prev) => ({
                            taskInstances: [...prev.taskInstances, newInstance],
                            users: prev.users.map((u) =>
                              u.id === currentUser.id ? { ...u, pointsBalance: u.pointsBalance + task.points } : u
                            ),
                            currentUser: prev.currentUser?.id === currentUser.id
                              ? { ...prev.currentUser, pointsBalance: prev.currentUser.pointsBalance + task.points }
                              : prev.currentUser,
                          }));
                          toast.success(t("claimSuccess", { title: task.title }), { description: t("claimSuccessPoints", { points: task.points }) });
                        } catch {
                          toast.error(t("claimError"));
                        } finally {
                          setClaimingTaskId(null);
                        }
                      }}
                    >
                      <Hand className="w-3 h-3 mr-1" />
                      {claimingTaskId === task?.id ? "..." : t("claim")}
                    </Button>
                  ) : instance?.state === "pending" ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={async () => {
                        updateTaskInstance(instance.id, "completed");
                        announce(t("taskCompleted", { title: task?.title ?? "" }));
                        try {
                          await syncInstanceState(instance.id, "completed", task!, currentUser!.id, "pending");
                        } catch {
                          updateTaskInstance(instance.id, "pending");
                        }
                      }}
                    >
                      {t("quickComplete")}
                    </Button>
                  ) : instance?.state === "completed" ? (
                    <Badge variant="secondary" className="text-green-600 bg-green-100 border-0 text-xs">
                      {t("done")}
                    </Badge>
                  ) : !instance ? (
                    <span className="text-xs text-muted-foreground">{t("loadingTask")}</span>
                  ) : null}
                </div>
              ))
            )}
            {hasMoreTasks && (
              <button
                onClick={() => router.push(`/${locale}/tasks`)}
                className="w-full text-center text-xs text-primary hover:underline font-medium pt-1"
              >
                {t("viewAllTasks", { count: allTodayTasksWithInfo.length })}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Target reward progress */}
        <div className="space-y-4">
          {currentTargetReward ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  {t("nextReward")}
                  {targetRewards.length > 1 && (
                    <span className="text-xs text-muted-foreground font-normal ml-auto">
                      {safeIdx + 1} / {targetRewards.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  {targetRewards.length > 1 && (
                    <button
                      onClick={() => setTargetRewardIdx((i) => (i - 1 + targetRewards.length) % targetRewards.length)}
                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl flex-shrink-0">
                    {currentTargetReward.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{currentTargetReward.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("pointsProgress", {
                        current: currentUser.pointsBalance.toLocaleString(),
                        needed: currentTargetReward.pointsCost.toLocaleString(),
                      })}
                    </p>
                  </div>
                  {targetRewards.length > 1 && (
                    <button
                      onClick={() => setTargetRewardIdx((i) => (i + 1) % targetRewards.length)}
                      className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Progress value={progressToTargetReward} className="h-3" />
                {currentUser.pointsBalance < currentTargetReward.pointsCost ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.rich("rewardPointsRemaining", {
                      points: (currentTargetReward.pointsCost - currentUser.pointsBalance).toLocaleString(),
                      highlight: (chunks) => <span className="font-semibold text-primary">{chunks}</span>,
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-green-600 font-semibold mt-2">
                    {t("rewardReady")}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="pt-5">
                <div className="flex flex-col items-center justify-center text-center py-4 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {t("chooseReward")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("chooseRewardDesc")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    onClick={() => router.push(`/${locale}/rewards`)}
                  >
                    <Gift className="w-3.5 h-3.5 mr-1.5" />
                    {t("viewRewards")}
                  </Button>
                </div>
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
                  <p className="text-2xl font-extrabold text-foreground">{t("streakCard", { days: stats.currentStreak })}</p>
                  <p className="text-sm text-muted-foreground">{t("streakDays", { days: stats.currentStreak })}</p>
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
                  {t("recentAchievements")}
                </CardTitle>
                <button
                  onClick={() => router.push(`/${locale}/achievements`)}
                  className="text-xs text-primary hover:underline"
                >
                  {t("viewAllAchievements")}
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
                {t("familyBoard")}
              </CardTitle>
              <button
                onClick={() => router.push(`/${locale}/board`)}
                className="text-xs text-primary hover:underline"
              >
                {t("viewBoard")}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {feedItems.length === 0 && pinnedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("boardEmpty")}</p>
                <button
                  onClick={() => router.push(`/${locale}/board`)}
                  className="text-xs text-primary hover:underline"
                >
                  {t("beFirst")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Pinned messages */}
                {pinnedItems.map((item) => (
                  <div key={item.id} className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <Pin className="w-3 h-3 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm leading-snug flex-1">
                        <span className="font-semibold">{item.userName}</span>
                        {" "}
                        <span className="text-muted-foreground">{item.content}</span>
                      </p>
                    </div>
                    <DashboardReactionRow
                      itemId={item.id}
                      grouped={getGroupedReactions(item.id)}
                      currentProfileId={currentUser.id}
                      onToggle={handleToggleReaction}
                      users={users}
                      pillBg="bg-white/60"
                    />
                  </div>
                ))}
                {/* Feed messages */}
                {feedItems.map((item) => (
                  <div key={item.id} className="rounded-lg bg-muted/30 border border-border/50 px-3 py-2">
                    <div className="flex items-start gap-2.5">
                      <p className="text-sm leading-snug flex-1">
                        <span className="font-semibold">{item.userName}</span>
                        {" "}
                        <span className="text-muted-foreground">{item.content}</span>
                      </p>
                      {item.amount != null && (
                        <span className={cn(
                          "text-xs font-bold flex-shrink-0",
                          item.amount > 0 ? "text-green-600" : "text-orange-500"
                        )}>
                          {item.amount > 0 ? "+" : ""}{item.amount}
                        </span>
                      )}
                    </div>
                    <DashboardReactionRow
                      itemId={item.id}
                      grouped={getGroupedReactions(item.id)}
                      currentProfileId={currentUser.id}
                      onToggle={handleToggleReaction}
                      users={users}
                      pillBg="bg-muted/50"
                    />
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

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "🔥"];

function DashboardReactionRow({
  itemId,
  grouped,
  currentProfileId,
  onToggle,
  users,
  pillBg,
}: {
  itemId: string;
  grouped: Record<string, { count: number; profileIds: string[] }>;
  currentProfileId: string;
  onToggle: (itemId: string, emoji: string) => void;
  users: ReturnType<typeof useAppStore.getState>["users"];
  pillBg: string;
}) {
  const t = useTranslations("board");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  return (
    <div className="flex items-center gap-1 flex-wrap justify-end mt-1">
      {Object.entries(grouped).map(([emoji, { count, profileIds }]) => {
        const isMine = profileIds.includes(currentProfileId);
        const reactors = profileIds
          .map((pid) => users.find((u) => u.id === pid)?.name)
          .filter(Boolean);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(itemId, emoji)}
            title={reactors.join(", ")}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-colors",
              "border hover:bg-muted/80",
              isMine
                ? "border-primary/40 bg-primary/10 text-primary"
                : cn("border-border text-muted-foreground", pillBg)
            )}
          >
            <span>{emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          aria-label={t("addReaction")}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors",
            "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            showPicker && "bg-muted text-foreground"
          )}
        >
          <SmilePlus className="w-3 h-3" />
        </button>
        {showPicker && (
          <div className="absolute bottom-full right-0 mb-1 z-10 bg-popover border border-border rounded-xl shadow-lg p-1.5 flex gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onToggle(itemId, emoji); setShowPicker(false); }}
                className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-sm transition-colors"
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
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
