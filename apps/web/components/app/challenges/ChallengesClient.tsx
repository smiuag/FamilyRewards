"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useChallengesStore } from "@/lib/store/useChallengesStore";
import { MOCK_USERS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, CheckCircle2, Clock, XCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FamilyChallenge } from "@/lib/challenges";

const STATUS_CONFIG = {
  active: { label: "Activo", color: "bg-blue-100 text-blue-700", icon: Zap },
  completed: { label: "Completado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700", icon: XCircle },
  upcoming: { label: "Próximo", color: "bg-amber-100 text-amber-700", icon: Clock },
};

export default function ChallengesClient() {
  const { currentUser } = useAppStore();
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
            Retos Familiares
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {active.length} activo(s) · {completed.length} completado(s)
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
              {f === "active" ? "Activos" : f === "completed" ? "Completados" : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay retos en esta categoría
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              currentUserId={currentUser.id}
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
  onContribute,
}: {
  challenge: FamilyChallenge;
  currentUserId: string;
  onContribute: (amount: number) => void;
}) {
  const status = STATUS_CONFIG[c.status];
  const StatusIcon = status.icon;
  const pct = Math.min(100, (c.currentProgress / c.goalTarget) * 100);

  const myContribution = c.contributions.find((con) => con.userId === currentUserId);

  const goalLabel =
    c.goalType === "collective_points"
      ? `${c.currentProgress.toLocaleString()} / ${c.goalTarget.toLocaleString()} pts`
      : `${c.currentProgress} / ${c.goalTarget} tareas`;

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
              status.color
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
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
            Aportaciones
          </p>
          <div className="flex flex-wrap gap-2">
            {c.contributions.map((con) => {
              const user = MOCK_USERS.find((u) => u.id === con.userId);
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
                      ? `${con.amount} pts`
                      : `${con.amount} tareas`}
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
                +{c.rewardPoints} pts por miembro al completar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {c.status === "active" && daysLeft > 0 && (
              <span className="text-xs text-muted-foreground">
                ⏳ {daysLeft} día{daysLeft !== 1 ? "s" : ""} restante{daysLeft !== 1 ? "s" : ""}
              </span>
            )}
            {c.status === "active" && (
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => onContribute(10)}
              >
                +10{" "}
                {c.goalType === "collective_points" ? "pts" : "tarea"}
              </Button>
            )}
            {c.status === "completed" && (
              <Badge className="bg-green-100 text-green-700 border-0">
                ✓ ¡Completado!
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
