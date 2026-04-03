"use client";

import { MOCK_USERS, MOCK_TASK_INSTANCES, MOCK_CLAIMS, MOCK_REWARDS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, Gift, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminStatsClient() {
  const members = MOCK_USERS.filter((u) => u.role !== "admin" || true); // show all

  // Points bar chart (mock)
  const maxPoints = Math.max(...members.map((u) => u.pointsBalance));

  // Weekly tasks (this week mock data)
  const weeklyData = members.map((user) => {
    const completed = MOCK_TASK_INSTANCES.filter(
      (ti) => ti.userId === user.id && ti.state === "completed"
    ).length;
    const total = MOCK_TASK_INSTANCES.filter((ti) => ti.userId === user.id).length;
    return { user, completed, total };
  });

  // Approved claims this month
  const approvedClaims = MOCK_CLAIMS.filter((c) => c.status === "approved");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Estadísticas Familiares</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Star className="w-5 h-5 text-primary fill-primary" />}
          label="Puntos totales familia"
          value={MOCK_USERS.reduce((a, u) => a + u.pointsBalance, 0).toLocaleString()}
          bg="bg-orange-50"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label="Tareas completadas (datos)"
          value={MOCK_TASK_INSTANCES.filter((ti) => ti.state === "completed").length}
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<Gift className="w-5 h-5 text-blue-500" />}
          label="Solicitudes pendientes"
          value={MOCK_CLAIMS.filter((c) => c.status === "pending").length}
          bg="bg-blue-50"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="Canjes aprobados"
          value={approvedClaims.length}
          bg="bg-purple-50"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Points bar chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Comparativa de puntos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((user) => {
              const pct = maxPoints > 0 ? (user.pointsBalance / maxPoints) * 100 : 0;
              return (
                <div key={user.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{user.avatar}</span>
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.role === "admin" && (
                        <Badge variant="outline" className="text-xs h-4">Admin</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-sm font-bold text-primary">
                        {user.pointsBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary to-orange-400 h-3 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Weekly tasks by member */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Rendimiento de miembros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyData.map(({ user, completed, total }) => {
              const pct = total > 0 ? (completed / total) * 100 : 0;
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {completed}/{total} completadas
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          pct >= 80
                            ? "bg-green-500"
                            : pct >= 50
                            ? "bg-amber-400"
                            : "bg-red-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold w-10 text-right",
                      pct >= 80
                        ? "text-green-600"
                        : pct >= 50
                        ? "text-amber-600"
                        : "text-red-500"
                    )}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Approved claims */}
      {approvedClaims.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Canjes aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {approvedClaims.map((claim) => {
                const reward = MOCK_REWARDS.find((r) => r.id === claim.rewardId);
                const user = MOCK_USERS.find((u) => u.id === claim.userId);
                return (
                  <div
                    key={claim.id}
                    className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-sm"
                  >
                    <span>{reward?.emoji}</span>
                    <span className="font-medium">{reward?.title}</span>
                    <span className="text-green-500">→ {user?.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
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
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
