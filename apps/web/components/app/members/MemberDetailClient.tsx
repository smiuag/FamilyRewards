"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter, useParams } from "next/navigation";
import { backfillInstances, fetchFamilyTasks, syncInstanceState } from "@/lib/api/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Star,
  ArrowLeft, Trophy, Users, ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PointsLink } from "@/components/ui/points-link";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { TaskState, TaskInstance } from "@/lib/types";

const DOW_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function getDow(d: Date) { return DOW_MAP[d.getDay()]; }

export default function MemberDetailClient() {
  const t = useTranslations("members");
  const { users, tasks, taskInstances, currentUser, updateTaskInstance, loadTaskInstances } = useAppStore();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const userId = params?.userId as string;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [loading, setLoading] = useState(false);

  const selectedDateStr = dateStr(selectedDate);
  const todayStr = dateStr(today);
  const isFutureDay = selectedDateStr > todayStr;

  const user = users.find((u) => u.id === userId);

  // Fetch fresh tasks + backfill instances when date changes
  useEffect(() => {
    if (!user || isFutureDay) return;
    const load = async () => {
      setLoading(true);
      try {
        // Always fetch fresh tasks (same as DashboardClient)
        const freshTasks = await fetchFamilyTasks();
        useAppStore.setState({ tasks: freshTasks });
        const instances = await backfillInstances(freshTasks, userId, selectedDate);
        loadTaskInstances([
          ...useAppStore.getState().taskInstances.filter((ti) => ti.userId !== userId),
          ...instances,
        ]);
      } catch {
        toast.error("Error al cargar las tareas");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, selectedDateStr]);

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Miembro no encontrado.
        <Button variant="link" onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  // Tasks that should appear this day
  const dow = getDow(selectedDate);
  const dayTasks = tasks.filter((task) => {
    if (!task.assignedTo.includes(userId)) return false;
    if (!task.isActive) return false;
    if (task.isRecurring) return (task.recurringPattern?.daysOfWeek ?? []).includes(dow);
    // Non-recurring: show from creation date onwards (until deadline if set)
    const created = task.createdAt.slice(0, 10);
    if (selectedDateStr < created) return false;
    if (task.deadline && selectedDateStr > task.deadline) return false;
    // If already completed on an earlier day, hide from subsequent days
    const inst = taskInstances.find((ti) => ti.taskId === task.id && ti.userId === userId);
    if (inst && inst.state === "completed" && inst.date < selectedDateStr) return false;
    return true;
  });

  // Pair task with instance
  const entries = dayTasks.map((task) => {
    const instance = taskInstances.find((ti) =>
      ti.userId === userId &&
      ti.taskId === task.id &&
      (task.isRecurring ? ti.date === selectedDateStr : true)
    ) ?? null;
    return { task, instance };
  });

  // Summary
  const dayInstances = taskInstances.filter((ti) => ti.userId === userId && ti.date === selectedDateStr);
  const completed  = dayInstances.filter((ti) => ti.state === "completed");
  const failed     = dayInstances.filter((ti) => ti.state === "failed");
  const cancelled  = dayInstances.filter((ti) => ti.state === "cancelled");
  const ptsEarned  = dayInstances.reduce((a, ti) => a + ti.pointsAwarded, 0);

  const handleStateChange = async (instance: TaskInstance, newState: TaskState) => {
    const task = tasks.find((t) => t.id === instance.taskId);
    if (!task) return;
    const prev = instance.state;
    updateTaskInstance(instance.id, newState);
    try {
      await syncInstanceState(instance.id, newState, task, userId, prev);
    } catch {
      updateTaskInstance(instance.id, prev);
      toast.error("Error al cambiar el estado");
    }
  };

  const stateConfig: Record<TaskState, { icon: React.ComponentType<{ className?: string }>; color: string; label: string; btnClass: string }> = {
    completed: { icon: CheckCircle2, color: "text-green-500", label: "Realizada",    btnClass: "bg-green-500 text-white hover:bg-green-600" },
    pending:   { icon: Clock,        color: "text-amber-500", label: "Pendiente",    btnClass: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
    failed:    { icon: XCircle,      color: "text-red-400",   label: "No realizada", btnClass: "bg-red-500 text-white hover:bg-red-600" },
    cancelled: { icon: MinusCircle,  color: "text-gray-400",  label: "Cancelada",    btnClass: "bg-gray-200 text-gray-600 hover:bg-gray-300" },
  };

  const dayLabel = isToday(selectedDate)
    ? "Hoy"
    : format(selectedDate, "EEEE d MMM", { locale: es });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Familia
        </button>
        <button onClick={() => router.push(`/${locale}/members`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Users className="w-4 h-4" /> Ver todos
        </button>
      </div>

      {/* Member header */}
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

      {/* Day navigator */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold capitalize text-muted-foreground">{dayLabel}</p>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="p-1.5 rounded-lg hover:bg-background transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setSelectedDate(today)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
              isToday(selectedDate) ? "bg-primary text-primary-foreground" : "hover:bg-background")}>
            <CalendarDays className="w-3.5 h-3.5" /> Hoy
          </button>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-1.5 rounded-lg hover:bg-background transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <SummaryCard icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Realizadas" value={completed.length} bg="bg-green-50" />
        <SummaryCard icon={<XCircle className="w-4 h-4 text-red-400" />}       label="No realizadas" value={failed.length}    bg="bg-red-50" />
        <SummaryCard icon={<MinusCircle className="w-4 h-4 text-gray-400" />}  label="Canceladas"    value={cancelled.length} bg="bg-gray-50" />
        <SummaryCard
          icon={<Star className="w-4 h-4 text-primary fill-primary" />}
          label="Puntos del día"
          value={<PointsLink className="hover:underline">{ptsEarned >= 0 ? `+${ptsEarned}` : String(ptsEarned)}</PointsLink>}
          bg="bg-orange-50"
        />
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            {isFutureDay ? "Sin tareas previstas para este día" : t("noTasks")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map(({ task, instance }) => {
            const state: TaskState = instance?.state ?? "pending";
            const cfg = stateConfig[state];
            const Icon = cfg.icon;
            const penalty = task.penaltyPoints ?? task.points;

            return (
              <Card key={task.id + selectedDateStr} className="shadow-sm">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <PointsLink className="text-primary font-medium hover:underline">+{task.points} pts</PointsLink>
                        {penalty > 0 && <PointsLink className="text-red-500 hover:underline">/ -{penalty}</PointsLink>}
                        {task.deadline && (
                          <span className={cn("font-medium",
                            task.deadline < selectedDateStr && state !== "completed" ? "text-red-600" : "text-amber-600")}>
                            Límite: {format(parseISO(task.deadline), "d MMM", { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* State selector — only for past/today with real instance */}
                    {!isFutureDay && instance ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(["completed", "pending", "failed", "cancelled"] as TaskState[]).filter((s) =>
                          s !== "cancelled" || currentUser?.role === "admin"
                        ).map((s) => {
                          const c = stateConfig[s];
                          const SIcon = c.icon;
                          const disabled = state === "cancelled" && currentUser?.role !== "admin";
                          return (
                            <button key={s} title={c.label}
                              onClick={() => !disabled && state !== s && handleStateChange(instance, s)}
                              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs",
                                disabled ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" :
                                state === s ? c.btnClass : "bg-muted text-muted-foreground hover:bg-muted/70"
                              )}>
                              <SIcon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic flex-shrink-0">
                        {isFutureDay ? "Futuro" : "—"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: React.ReactNode; bg: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-3 pb-2">
        <div className={cn("inline-flex p-1.5 rounded-lg mb-1.5", bg)}>{icon}</div>
        <p className="text-lg font-extrabold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
