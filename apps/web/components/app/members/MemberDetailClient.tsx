"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Star,
  ArrowLeft,
  Flame,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Period = "today" | "week" | "month";

export default function MemberDetailClient() {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const { users, tasks, taskInstances } = useAppStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const userId = params?.userId as string;

  const [period, setPeriod] = useState<Period>("today");

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Miembro no encontrado.
        <Button variant="link" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const getDateRange = (): [string, string] => {
    if (period === "today") return [today, today];
    if (period === "week") {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay() + 1); // Monday
      return [start.toISOString().split("T")[0], today];
    }
    // month
    const start = new Date();
    start.setDate(1);
    return [start.toISOString().split("T")[0], today];
  };

  const [dateFrom, dateTo] = getDateRange();

  const periodInstances = taskInstances.filter(
    (ti) => ti.userId === userId && ti.date >= dateFrom && ti.date <= dateTo
  );

  const completed = periodInstances.filter((ti) => ti.state === "completed");
  const pending = periodInstances.filter((ti) => ti.state === "pending");
  const notCompleted = periodInstances.filter((ti) => ti.state === "not_completed");
  const omitted = periodInstances.filter((ti) => ti.state === "omitted");
  const ptsEarned = completed.reduce((a, ti) => a + ti.pointsAwarded, 0);

  const stateConfig = {
    completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 border-green-200", label: "Completada" },
    pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50 border-amber-200", label: "Pendiente" },
    not_completed: { icon: XCircle, color: "text-red-400", bg: "bg-red-50 border-red-200", label: "No completada" },
    omitted: { icon: MinusCircle, color: "text-gray-400", bg: "bg-gray-50 border-gray-200", label: "Omitida" },
  };

  // Group by date for week/month
  const byDate = periodInstances.reduce<Record<string, typeof periodInstances>>((acc, ti) => {
    acc[ti.date] = acc[ti.date] ?? [];
    acc[ti.date].push(ti);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.push(`/${locale}/members`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Familia
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl">
          {user.avatar}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role === "admin" ? t("admin") : t("member")}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="font-bold text-primary">{user.pointsBalance.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">pts totales</span>
          </div>
        </div>
      </div>

      {/* Period selector */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">{tCommon("today")}</TabsTrigger>
          <TabsTrigger value="week" className="flex-1">{tCommon("week")}</TabsTrigger>
          <TabsTrigger value="month" className="flex-1">{tCommon("month")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
          label="Completadas"
          value={completed.length}
          bg="bg-green-50"
        />
        <SummaryCard
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          label="Pendientes"
          value={pending.length}
          bg="bg-amber-50"
        />
        <SummaryCard
          icon={<Star className="w-4 h-4 text-primary fill-primary" />}
          label="Pts ganados"
          value={ptsEarned}
          bg="bg-orange-50"
        />
        <SummaryCard
          icon={<Trophy className="w-4 h-4 text-purple-500" />}
          label="Tasa"
          value={
            periodInstances.length > 0
              ? `${Math.round((completed.length / periodInstances.length) * 100)}%`
              : "—"
          }
          bg="bg-purple-50"
        />
      </div>

      {/* Task list */}
      {periodInstances.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            {t("noTasks")}
          </CardContent>
        </Card>
      ) : period === "today" ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tareas de hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {periodInstances.map((ti) => {
              const task = tasks.find((t) => t.id === ti.taskId);
              const cfg = stateConfig[ti.state];
              const Icon = cfg.icon;
              return (
                <div
                  key={ti.id}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border", cfg.bg)}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color)} />
                  <span className="flex-1 text-sm font-medium">{task?.title ?? "Tarea"}</span>
                  {ti.state === "completed" && ti.pointsAwarded > 0 && (
                    <span className="text-xs font-bold text-primary">+{ti.pointsAwarded} pts</span>
                  )}
                  <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const dayInstances = byDate[date];
            const dayCompleted = dayInstances.filter((ti) => ti.state === "completed");
            const dayPts = dayCompleted.reduce((a, ti) => a + ti.pointsAwarded, 0);
            return (
              <Card key={date} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold capitalize">
                      {format(new Date(date + "T12:00:00"), "EEEE, d MMM", { locale: es })}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{dayCompleted.length}/{dayInstances.length}</span>
                      {dayPts > 0 && (
                        <span className="font-bold text-primary">+{dayPts} pts</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                  {dayInstances.map((ti) => {
                    const task = tasks.find((t) => t.id === ti.taskId);
                    const cfg = stateConfig[ti.state];
                    const Icon = cfg.icon;
                    return (
                      <div key={ti.id} className="flex items-center gap-2 text-sm">
                        <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color)} />
                        <span className="flex-1 text-muted-foreground">{task?.title ?? "Tarea"}</span>
                        {ti.state === "completed" && ti.pointsAwarded > 0 && (
                          <span className="text-xs font-semibold text-primary">+{ti.pointsAwarded}</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
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
  value: number | string;
  bg: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4 pb-3">
        <div className={cn("inline-flex p-1.5 rounded-lg mb-2", bg)}>{icon}</div>
        <p className="text-xl font-extrabold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
