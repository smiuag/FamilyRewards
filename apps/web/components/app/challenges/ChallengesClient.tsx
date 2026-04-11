"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { useChallengesStore } from "@/lib/store/useChallengesStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, CheckCircle2, Clock, XCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FamilyChallenge } from "@/lib/challenges";

const STATUS_ICONS = {
  active: Zap,
  completed: CheckCircle2,
  failed: XCircle,
  upcoming: Clock,
};

const STATUS_COLORS = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  upcoming: "bg-amber-100 text-amber-700",
};

const STATUS_LABEL_KEYS = {
  active: "statusActive",
  completed: "statusCompleted",
  failed: "statusFailed",
  upcoming: "statusUpcoming",
} as const;

export default function ChallengesClient() {
  const t = useTranslations("challenges");
  const { currentUser, users } = useAppStore();
  const { challenges, contribute } = useChallengesStore();
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  if (!currentUser) return null;

  const filtered =
    filter === "all" ? challenges : challenges.filter((c) => c.status === filter);

  const active = challenges.filter((c) => c.status === "active");
  const completed = challenges.filter((c) => c.status === "completed");

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
            {t("activeSummary", { count: active.length })} · {t("completedSummary", { count: completed.length })}
          </p>
        </div>
        <div className="flex gap-2">
          {(["active", "completed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f === "active" ? t("filterActive") : f === "completed" ? t("filterCompleted") : t("filterAll")}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("emptyCategory")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              currentUserId={currentUser.id}
              users={users}
              onContribute={(amount) => contribute(c.id, currentUser.id, amount)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({
  challenge: c,
  currentUserId,
  users,
  onContribute,
}: {
  challenge: FamilyChallenge;
  currentUserId: string;
  users: { id: string; name: string; avatar: string }[];
  onContribute: (amount: number) => void;
}) {
  const t = useTranslations("challenges");
  const StatusIcon = STATUS_ICONS[c.status];
  const statusColor = STATUS_COLORS[c.status];
  const statusLabel = t(STATUS_LABEL_KEYS[c.status]);
  const pct = Math.min(100, (c.currentProgress / c.goalTarget) * 100);

  const myContribution = c.contributions.find((con) => con.userId === currentUserId);

  const goalLabel =
    c.goalType === "collective_points"
      ? t("goalPoints", { current: c.currentProgress.toLocaleString(), target: c.goalTarget.toLocaleString() })
      : t("goalTasks", { current: c.currentProgress, target: c.goalTarget });

  const daysLeft = Math.ceil(
    (new Date(c.endDate).getTime() - Date.now()) / 86400000
  );

  return (
    <Card className="shadow-sm overflow-hidden">
      <div
        className={cn(
          "h-1.5",
          c.status === "completed"
            ? "bg-green-400"
            : c.status === "failed"
            ? "bg-red-400"
            : "bg-primary"
        )}
        style={{ width: `${pct}%` }}
      />
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{c.emoji}</div>
            <div>
              <CardTitle className="text-base font-bold">{c.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
            </div>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0",
              statusColor
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {statusLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">{goalLabel}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>

        {/* Contributions */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {t("contributions")}
          </p>
          <div className="flex flex-wrap gap-2">
            {c.contributions.map((con) => {
              const user = users.find((u) => u.id === con.userId);
              if (!user) return null;
              return (
                <div
                  key={con.userId}
                  className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl text-sm"
                >
                  <span>{user.avatar}</span>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground">
                    {c.goalType === "collective_points"
                      ? t("contributionPoints", { amount: con.amount })
                      : t("contributionTasks", { amount: con.amount })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward + footer */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">{c.rewardEmoji}</span>
            <div>
              <p className="font-semibold">{c.rewardDescription}</p>
              <p className="text-xs text-muted-foreground">
                {t("rewardPerMember", { points: c.rewardPoints })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {c.status === "active" && daysLeft > 0 && (
              <span className="text-xs text-muted-foreground">
                {daysLeft !== 1
                  ? t("daysLeftPlural", { count: daysLeft })
                  : t("daysLeft", { count: daysLeft })}
              </span>
            )}
            {c.status === "active" && (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => onContribute(10)}
              >
                {c.goalType === "collective_points"
                  ? t("contributePoints", { amount: 10 })
                  : t("contributeTask", { amount: 10 })}
              </Button>
            )}
            {c.status === "completed" && (
              <Badge className="bg-green-100 text-green-700 border-0">
                {t("completedBadge")}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
