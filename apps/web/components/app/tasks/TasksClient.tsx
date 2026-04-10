"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { backfillInstances, syncInstanceState, fetchFamilyTasks } from "@/lib/api/tasks";
import { toast } from "sonner";
import type { Task, TaskState, TaskInstance } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, MinusCircle, Star, Flame,
  ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { cn } from "@/lib/utils";
import { format, isToday, isFuture, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const DOW_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getDow(d: Date) {
  return DOW_MAP[d.getDay()];
}

// Tasks that should appear on a given day (future: calculated; past/today: from instances)
function getTasksForDay(tasks: Task[], day: Date): Task[] {
  const ds = dateStr(day);
  const dow = getDow(day);
  return tasks.filter((t) => {
    if (!t.isActive) return false;
    if (t.isRecurring) {
      return (t.recurringPattern?.daysOfWeek ?? []).includes(dow);
    }
    // Non-recurring with deadline: show every day from creation until deadline
    if (t.deadline) {
      const created = t.createdAt.slice(0, 10);
      return ds >= created && ds <= t.deadline;
    }
    // Non-recurring without deadline: only show on creation day
    return t.createdAt.slice(0, 10) === ds;
  });
}

export default function TasksClient() {
  const t = useTranslations("tasks");
  const { currentUser, tasks, taskInstances, updateTaskInstance, loadTasks, loadTaskInstances,
    streakAlert, clearStreakAlert, unlockFeature, adjustPoints } = useAppStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [loading, setLoading] = useState(true);

  const selectedDateStr = dateStr(selectedDate);
  const isFutureDay = selectedDateStr > dateStr(today);
  const todayStr = dateStr(today);

  // Load and backfill up to selected date (only for past/today)
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        let activeTasks = tasks;
        if (tasks.length === 0) {
          activeTasks = await fetchFamilyTasks();
          loadTasks(activeTasks);
        }
        if (!isFutureDay) {
          const instances = await backfillInstances(activeTasks, currentUser.id, selectedDate);
          // Replace instances for this user (keep other users')
          loadTaskInstances([
            ...useAppStore.getState().taskInstances.filter((ti) => ti.userId !== currentUser.id),
            ...instances,
          ]);
        }
      } catch {
        toast.error("Error al cargar las tareas");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.id, selectedDateStr]);

  if (!currentUser) return null;

  // Tasks that should appear this day
  const dayTasks = getTasksForDay(tasks, selectedDate);

  // Build display entries: pair task with its instance (if any)
  const entries = dayTasks.map((task) => {
    // For recurring: find instance on the exact selected date
    // For non-recurring with deadline: find its single instance (any date)
    const instance = taskInstances.find((ti) =>
      ti.userId === currentUser.id &&
      ti.taskId === task.id &&
      (task.isRecurring ? ti.date === selectedDateStr : true)
    ) ?? null;
    return { task, instance };
  });

  const handleStateChange = async (task: Task, instance: TaskInstance, newState: TaskState) => {
    // Toggle: clicking same state reverts to pending
    const resolved: TaskState = instance.state === newState ? "pending" : newState;
    updateTaskInstance(instance.id, resolved);
    try {
      await syncInstanceState(instance.id, resolved, task, instance.userId, instance.state);
    } catch {
      updateTaskInstance(instance.id, instance.state);
      toast.error("Error al guardar el estado de la tarea");
    }
  };

  const dayLabel = isToday(selectedDate)
    ? "Hoy"
    : format(selectedDate, "EEEE, d MMM", { locale: es });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground capitalize">{format(selectedDate, "EEEE, d MMMM yyyy", { locale: es })}</p>
        </div>
        {/* Day navigator */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="p-1.5 rounded-lg hover:bg-background transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setSelectedDate(today)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1",
              isToday(selectedDate) ? "bg-primary text-primary-foreground" : "hover:bg-background")}>
            <CalendarDays className="w-3.5 h-3.5" />
            Hoy
          </button>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-1.5 rounded-lg hover:bg-background transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isFutureDay && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          <span>Vista previa — no se pueden marcar tareas de días futuros</span>
        </div>
      )}

      {/* Streak unlock modal */}
      <AppModal open={!!streakAlert} onOpenChange={() => clearStreakAlert()}>
        <AppModalHeader
          emoji="🔥"
          title="¡Racha increíble!"
          description={`${streakAlert?.userName} lleva ${streakAlert?.days} días completando todas sus tareas`}
          color="bg-gradient-to-br from-orange-500 to-red-600"
          onClose={clearStreakAlert}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ¿Quieres bonificar esta racha y activar el <strong>sistema de rachas</strong>?
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Bonus de racha</p>
              <p className="text-xs text-orange-600">+50 pts por 7 días · +100 por 14 días · +250 por 30 días</p>
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={clearStreakAlert}>Ahora no</Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => {
              if (streakAlert) {
                adjustPoints(streakAlert.userId, 50, `Bonus de racha — ${streakAlert.days} días consecutivos`);
                unlockFeature("streaks");
              }
              clearStreakAlert();
            }}
          >
            <Flame className="w-4 h-4 mr-1.5" />
            Activar y bonificar (+50 pts)
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium">Sin tareas este día</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map(({ task, instance }) => (
            <TaskCard
              key={task.id + selectedDateStr}
              task={task}
              instance={instance}
              isFuture={isFutureDay}
              selectedDate={selectedDateStr}
              onStateChange={handleStateChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  instance,
  isFuture,
  selectedDate,
  onStateChange,
}: {
  task: Task;
  instance: TaskInstance | null;
  isFuture: boolean;
  selectedDate: string;
  onStateChange: (task: Task, instance: TaskInstance, state: TaskState) => void;
}) {
  const state: TaskState = instance?.state ?? "pending";

  const borderColor =
    state === "completed" ? "border-green-200 bg-green-50/50" :
    state === "failed"    ? "border-red-200 bg-red-50/50" :
    state === "cancelled" ? "border-gray-200 bg-gray-50/50" :
    "border-border bg-white";

  const stateIcon =
    state === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
    state === "failed"    ? <XCircle className="w-5 h-5 text-red-400" /> :
    state === "cancelled" ? <MinusCircle className="w-5 h-5 text-gray-400" /> :
    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />;

  const isDeadlineTask = !task.isRecurring && !!task.deadline;
  const deadlineLabel = task.deadline
    ? format(parseISO(task.deadline), "d MMM", { locale: es })
    : null;
  const isOverdue = task.deadline && task.deadline < selectedDate && state !== "completed";
  const completedDateLabel = (state === "completed" && instance)
    ? format(parseISO(instance.date), "d MMM", { locale: es })
    : null;

  const penalty = task.penaltyPoints ?? task.points;

  return (
    <Card className={cn("border-2 shadow-sm transition-all", borderColor, isFuture && "opacity-70")}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{stateIcon}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("font-semibold", state === "cancelled" && "line-through text-muted-foreground")}>
                {task.title}
              </span>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-medium text-primary">+{task.points} pts</span>
                {penalty > 0 && (
                  <span className="text-xs text-red-500 font-medium">/ -{penalty}</span>
                )}
              </div>
              {isDeadlineTask && deadlineLabel && (
                <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full",
                  isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                  Límite: {deadlineLabel}
                </span>
              )}
              {completedDateLabel && isDeadlineTask && (
                <span className="text-xs text-green-600 font-medium">
                  Completada el {completedDateLabel}
                </span>
              )}
            </div>
          </div>

          {/* Actions — only for past/today, only if instance exists */}
          {!isFuture && instance && state !== "cancelled" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onStateChange(task, instance, "completed")}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  state === "completed"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-600"
                )}
                title="Completada"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStateChange(task, instance, "failed")}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  state === "failed"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600"
                )}
                title="No realizada"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          {!isFuture && instance && state === "cancelled" && (
            <span className="text-xs text-muted-foreground italic flex-shrink-0">Cancelada</span>
          )}
          {!isFuture && !instance && (
            <span className="text-xs text-muted-foreground italic flex-shrink-0">—</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
