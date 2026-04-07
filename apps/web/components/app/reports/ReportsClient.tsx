"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { buildFamilyReport } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Star,
  Crown,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default function ReportsClient() {
  const { currentUser, users, taskInstances, tasks } = useAppStore();
  const [period, setPeriod] = useState<"week" | "month">("week");

  if (!currentUser) return null;

  const report = buildFamilyReport(users, taskInstances, period, tasks);

  // My report
  const myReport = report.memberReports.find(
    (r) => r.user.id === currentUser.id
  );
  const maxPoints = Math.max(
    ...report.memberReports.map((r) => r.totalPoints),
    1
  );

  const periodLabel =
    period === "week"
      ? `Semana del ${format(new Date(report.startDate), "d MMM", { locale: es })}`
      : format(new Date(report.startDate), "MMMM yyyy", { locale: es });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Informes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 capitalize">
            {periodLabel}
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {p === "week" ? "Esta semana" : "Este mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Family summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-extrabold">{report.totalCompleted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tareas completadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <Star className="w-5 h-5 text-primary fill-primary" />
            </div>
            <p className="text-2xl font-extrabold">{report.totalPoints}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Puntos totales</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold">{report.completionRate}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tasa de completado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar chart — points per member */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Puntos por miembro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.memberReports
              .sort((a, b) => b.totalPoints - a.totalPoints)
              .map((r, i) => (
                <div key={r.user.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span>{r.user.avatar}</span>
                      <span className="font-medium">{r.user.name}</span>
                      {r.user.id === report.bestMemberId && (
                        <Crown className="w-3.5 h-3.5 text-yellow-500" />
                      )}
                    </div>
                    <span className="font-semibold text-primary">
                      {r.totalPoints} pts
                    </span>
                  </div>
                  <Progress
                    value={(r.totalPoints / maxPoints) * 100}
                    className={cn(
                      "h-2.5",
                      i === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-primary/50"
                    )}
                  />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* My daily breakdown */}
        {myReport && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Mi actividad diaria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myReport.dailyBreakdown.length > 0 ? (
                <div className="flex items-end gap-1.5 h-28">
                  {myReport.dailyBreakdown.map((day, i) => {
                    const maxDay = Math.max(
                      ...myReport.dailyBreakdown.map((d) => d.completed),
                      1
                    );
                    const heightPct = (day.completed / maxDay) * 100;
                    const isToday =
                      day.date === new Date().toISOString().split("T")[0];
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div className="w-full flex flex-col justify-end h-20">
                          <div
                            className={cn(
                              "w-full rounded-t-md transition-all",
                              isToday ? "bg-primary" : "bg-primary/30"
                            )}
                            style={{ height: `${heightPct}%` }}
                            title={`${day.completed} tareas, ${day.points} pts`}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-[10px]",
                            isToday
                              ? "font-bold text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {DAY_LABELS[new Date(day.date + "T12:00:00").getDay() === 0 ? 6 : new Date(day.date + "T12:00:00").getDay() - 1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin actividad en este período
                </p>
              )}
              <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                <span>
                  ✅ {myReport.totalCompleted} completadas
                </span>
                <span>
                  ⭐ {myReport.totalPoints} pts
                </span>
                <span>
                  📊 {myReport.completionRate}% tasa
                </span>
              </div>
              {myReport.topTask && (
                <p className="text-xs text-muted-foreground mt-2">
                  🏆 Tarea estrella: <span className="font-medium text-foreground">{myReport.topTask}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Per-member detail */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Detalle por miembro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-medium">Miembro</th>
                  <th className="text-right pb-2 font-medium">Completadas</th>
                  <th className="text-right pb-2 font-medium">Omitidas</th>
                  <th className="text-right pb-2 font-medium">Tasa</th>
                  <th className="text-right pb-2 font-medium">Puntos</th>
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
                            <Crown className="w-3.5 h-3.5 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2.5 text-green-600 font-semibold">
                        {r.totalCompleted}
                      </td>
                      <td className="text-right py-2.5 text-muted-foreground">
                        {r.totalOmitted}
                      </td>
                      <td className="text-right py-2.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            r.completionRate >= 80
                              ? "bg-green-100 text-green-700"
                              : r.completionRate >= 50
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {r.completionRate}%
                        </span>
                      </td>
                      <td className="text-right py-2.5 font-bold text-primary">
                        {r.totalPoints}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
