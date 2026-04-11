"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { backfillInstances, syncInstanceState, fetchFamilyTasks, claimTask, shareTaskPoints } from "@/lib/api/tasks";
import { toast } from "sonner";
import type { Task, TaskState, TaskInstance } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, XCircle, MinusCircle, Star, Flame,
  ChevronLeft, ChevronRight, CalendarDays, Hand, Users,
} from "lucide-react";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
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

// Tasks that should appear on a given day for a user
function getTasksForDay(tasks: Task[], day: Date, userId: string): Task[] {
  const ds = dateStr(day);
  const dow = getDow(day);
  return tasks.filter((t) => {
    if (!t.isActive) return false;
    // Show tasks assigned to user OR unassigned (claimable)
    const isAssigned = t.assignedTo.includes(userId);
    const isClaimable = t.assignedTo.length === 0;
    if (!isAssigned && !isClaimable) return false;

    if (t.isRecurring) {
      return (t.recurringPattern?.daysOfWeek ?? []).includes(dow);
    }
    // Non-recurring: show from creation date onwards (until deadline if set)
    const created = t.createdAt.slice(0, 10);
    if (ds < created) return false;
    if (t.deadline && ds > t.deadline) return false;
    return true;
  });
}

export default function TasksClient() {
  const t = useTranslations("tasks");
  const {
    currentUser, users, tasks, taskInstances, updateTaskInstance, loadTasks, loadTaskInstances,
    streakAlert, clearStreakAlert, unlockFeature, adjustPoints,
  } = useAppStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [loading, setLoading] = useState(true);

  // Share points modal state
  const [shareTask, setShareTask] = useState<{ task: Task; instance: TaskInstance } | null>(null);
  const [shareHelper, setShareHelper] = useState<string>("");
  const [shareAmount, setShareAmount] = useState("");
  const [sharing, setSharing] = useState(false);

  // Claiming state
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  const selectedDateStr = dateStr(selectedDate);
  const isFutureDay = selectedDateStr > dateStr(today);

  // Load and backfill up to selected date
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

  const dayTasks = getTasksForDay(tasks, selectedDate, currentUser.id);

  // Pair tasks with instances
  const entries = dayTasks.map((task) => {
    const isClaimable = task.assignedTo.length === 0;
    const instance = taskInstances.find((ti) =>
      ti.taskId === task.id &&
      (isClaimable ? true : ti.userId === currentUser.id) &&
      (task.isRecurring ? ti.date === selectedDateStr : true)
    ) ?? null;
    return { task, instance, isClaimable };
  });

  // Separate assigned vs claimable for rendering
  const assignedEntries = entries.filter((e) => !e.isClaimable);
  const claimableEntries = entries.filter((e) => e.isClaimable);

  const handleStateChange = async (task: Task, instance: TaskInstance, newState: TaskState) => {
    const resolved: TaskState = instance.state === newState ? "pending" : newState;
    updateTaskInstance(instance.id, resolved);
    try {
      await syncInstanceState(instance.id, resolved, task, instance.userId, instance.state);
    } catch {
      updateTaskInstance(instance.id, instance.state);
      toast.error("Error al guardar el estado de la tarea");
    }
  };

  const handleClaim = async (task: Task) => {
    setClaimingTaskId(task.id);
    try {
      const instance = await claimTask(task, currentUser.id, selectedDateStr);
      if (!instance) {
        toast.error("Alguien ya ha reclamado esta tarea");
        return;
      }
      // Update store
      useAppStore.setState((prev) => ({
        taskInstances: [...prev.taskInstances, instance],
        users: prev.users.map((u) =>
          u.id === currentUser.id ? { ...u, pointsBalance: u.pointsBalance + task.points } : u
        ),
        currentUser: prev.currentUser?.id === currentUser.id
          ? { ...prev.currentUser, pointsBalance: prev.currentUser.pointsBalance + task.points }
          : prev.currentUser,
      }));
      toast.success(`"${task.title}" reclamada`, {
        description: `+${task.points} puntos`,
      });
    } catch {
      toast.error("Error al reclamar la tarea");
    } finally {
      setClaimingTaskId(null);
    }
  };

  const openShareModal = (task: Task, instance: TaskInstance) => {
    setShareTask({ task, instance });
    setShareHelper("");
    setShareAmount(String(Math.floor(task.points / 2)));
  };

  const handleShare = async () => {
    if (!shareTask || !shareHelper) return;
    const amount = parseInt(shareAmount) || 0;
    if (amount <= 0) { toast.error("Indica una cantidad mayor que 0"); return; }
    if (amount > shareTask.task.points) { toast.error("No puedes ceder más puntos de los que vale la tarea"); return; }

    const helper = users.find((u) => u.id === shareHelper);
    if (!helper) return;

    setSharing(true);
    try {
      await shareTaskPoints(
        currentUser.id,
        shareHelper,
        amount,
        shareTask.task.title,
        helper.name,
        currentUser.name,
      );
      // Update store balances
      useAppStore.setState((prev) => ({
        users: prev.users.map((u) => {
          if (u.id === currentUser.id) return { ...u, pointsBalance: Math.max(0, u.pointsBalance - amount) };
          if (u.id === shareHelper) return { ...u, pointsBalance: u.pointsBalance + amount };
          return u;
        }),
        currentUser: prev.currentUser?.id === currentUser.id
          ? { ...prev.currentUser, pointsBalance: Math.max(0, prev.currentUser.pointsBalance - amount) }
          : prev.currentUser,
      }));
      toast.success(`${amount} puntos compartidos con ${helper.name}`);
      setShareTask(null);
    } catch {
      toast.error("Error al compartir los puntos");
    } finally {
      setSharing(false);
    }
  };

  const dayLabel = isToday(selectedDate)
    ? "Hoy"
    : format(selectedDate, "EEEE, d MMM", { locale: es });

  const otherMembers = users.filter((u) => u.id !== currentUser.id);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground capitalize">{format(selectedDate, "EEEE, d MMMM yyyy", { locale: es })}</p>
        </div>
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
          {/* Assigned tasks */}
          {assignedEntries.map(({ task, instance }) => (
            <TaskCard
              key={task.id + selectedDateStr}
              task={task}
              instance={instance}
              isFuture={isFutureDay}
              selectedDate={selectedDateStr}
              onStateChange={handleStateChange}
              onShare={openShareModal}
              currentUserId={currentUser.id}
            />
          ))}

          {/* Claimable tasks section */}
          {claimableEntries.length > 0 && (
            <>
              {assignedEntries.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Hand className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-muted-foreground">Tareas sin asignar</span>
                  <span className="text-xs text-muted-foreground">— la primera persona que la reclame se lleva los puntos</span>
                </div>
              )}
              {claimableEntries.map(({ task, instance }) => (
                <ClaimableTaskCard
                  key={task.id + selectedDateStr}
                  task={task}
                  instance={instance}
                  isFuture={isFutureDay}
                  claiming={claimingTaskId === task.id}
                  onClaim={() => handleClaim(task)}
                  onShare={openShareModal}
                  currentUserId={currentUser.id}
                  users={users}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Share points modal */}
      <AppModal open={!!shareTask} onOpenChange={() => setShareTask(null)}>
        <AppModalHeader
          emoji="🤝"
          title="Compartir puntos"
          description={shareTask?.task.title}
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
          onClose={() => setShareTask(null)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            ¿Alguien te ha ayudado con esta tarea? Puedes cederle parte de los puntos.
          </p>

          <div>
            <Label className="mb-2 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              ¿Quién te ha ayudado?
            </Label>
            <div className="flex gap-2 flex-wrap">
              {otherMembers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setShareHelper(u.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all",
                    shareHelper === u.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-transparent text-muted-foreground"
                  )}
                >
                  <span>{u.avatar}</span>
                  {u.name}
                </button>
              ))}
              {otherMembers.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay otros miembros</p>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Puntos a ceder</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={shareAmount}
                onChange={(e) => setShareAmount(e.target.value)}
                min="1"
                max={String(shareTask?.task.points ?? 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                de {shareTask?.task.points ?? 0} pts totales
              </span>
            </div>
          </div>

          {shareHelper && parseInt(shareAmount) > 0 && (
            <div className="bg-muted rounded-xl p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Tú</span>: te quedas con{" "}
                <span className="font-bold text-primary">
                  {(shareTask?.task.points ?? 0) - (parseInt(shareAmount) || 0)} pts
                </span>
              </p>
              <p>
                <span className="font-medium">{users.find((u) => u.id === shareHelper)?.name}</span>: recibe{" "}
                <span className="font-bold text-primary">{parseInt(shareAmount) || 0} pts</span>
              </p>
            </div>
          )}
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setShareTask(null)}>Cancelar</Button>
          <Button onClick={handleShare} disabled={!shareHelper || sharing || !(parseInt(shareAmount) > 0)}>
            {sharing ? "Compartiendo..." : "Compartir puntos"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}

// ── Assigned TaskCard ────────────────────────────────────────

function TaskCard({
  task,
  instance,
  isFuture,
  selectedDate,
  onStateChange,
  onShare,
  currentUserId,
}: {
  task: Task;
  instance: TaskInstance | null;
  isFuture: boolean;
  selectedDate: string;
  onStateChange: (task: Task, instance: TaskInstance, state: TaskState) => void;
  onShare: (task: Task, instance: TaskInstance) => void;
  currentUserId: string;
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
    ? format(new Date(task.deadline + "T00:00:00"), "d MMM", { locale: es })
    : null;
  const isOverdue = task.deadline && task.deadline < selectedDate && state !== "completed";

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
              {/* Share link for completed tasks */}
              {state === "completed" && instance && (
                <button
                  onClick={() => onShare(task, instance)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-0.5"
                >
                  🤝 Compartir pts
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isFuture && instance && state !== "cancelled" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onStateChange(task, instance, "completed")}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  state === "completed"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-600"
                )}
                aria-label={`Marcar "${task.title}" como completada`}
                aria-pressed={state === "completed"}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => onStateChange(task, instance, "failed")}
                className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  state === "failed"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600"
                )}
                aria-label={`Marcar "${task.title}" como no realizada`}
                aria-pressed={state === "failed"}
              >
                <XCircle className="w-4 h-4" aria-hidden="true" />
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

// ── Claimable TaskCard ───────────────────────────────────────

function ClaimableTaskCard({
  task,
  instance,
  isFuture,
  claiming,
  onClaim,
  onShare,
  currentUserId,
  users,
}: {
  task: Task;
  instance: TaskInstance | null;
  isFuture: boolean;
  claiming: boolean;
  onClaim: () => void;
  onShare: (task: Task, instance: TaskInstance) => void;
  currentUserId: string;
  users: Array<{ id: string; name: string; avatar: string }>;
}) {
  const isClaimed = !!instance;
  const claimedByMe = instance?.userId === currentUserId;
  const claimedByOther = isClaimed && !claimedByMe;
  const claimer = claimedByOther ? users.find((u) => u.id === instance?.userId) : null;

  return (
    <Card className={cn(
      "border-2 shadow-sm transition-all",
      isClaimed
        ? claimedByMe
          ? "border-green-200 bg-green-50/50"
          : "border-gray-200 bg-gray-50/50"
        : "border-amber-200 bg-amber-50/30",
      isFuture && "opacity-70"
    )}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {isClaimed
              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : <Hand className="w-5 h-5 text-amber-500" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{task.title}</span>
              {!isClaimed && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Sin asignar</Badge>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-xs font-medium text-primary">+{task.points} pts</span>
              </div>
              {claimedByMe && (
                <span className="text-xs text-green-600 font-medium">Reclamada por ti</span>
              )}
              {claimedByOther && claimer && (
                <span className="text-xs text-muted-foreground">
                  Reclamada por {claimer.avatar} {claimer.name}
                </span>
              )}
              {/* Share link if claimed by me */}
              {claimedByMe && instance && (
                <button
                  onClick={() => onShare(task, instance)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-0.5"
                >
                  🤝 Compartir pts
                </button>
              )}
            </div>
          </div>

          {/* Claim button */}
          {!isFuture && !isClaimed && (
            <Button
              size="sm"
              className="h-8 text-xs bg-amber-500 hover:bg-amber-600 flex-shrink-0"
              onClick={onClaim}
              disabled={claiming}
            >
              <Hand className="w-3.5 h-3.5 mr-1" />
              {claiming ? "..." : "Reclamar"}
            </Button>
          )}
          {isFuture && !isClaimed && (
            <span className="text-xs text-muted-foreground italic flex-shrink-0">Disponible</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
