"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import type { Task, TaskState, TaskInstance } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, MinusCircle, RefreshCw, Star, Flame } from "lucide-react";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Filter = "all" | "pending" | "completed";

export default function TasksClient() {
  const t = useTranslations("tasks");
  const { currentUser, tasks, taskInstances, updateTaskInstance, streakAlert, clearStreakAlert, unlockFeature, adjustPoints } = useAppStore();
  const [filter, setFilter] = useState<Filter>("all");

  if (!currentUser) return null;

  const today = new Date().toISOString().split("T")[0];
  const formattedDate = format(new Date(), "EEEE, d MMMM", { locale: es });

  const todayInstances = taskInstances.filter(
    (ti) => ti.userId === currentUser.id && ti.date === today
  );

  const filtered = todayInstances.filter((ti) => {
    if (filter === "pending") return ti.state === "pending";
    if (filter === "completed") return ti.state === "completed" || ti.state === "not_completed";
    return true;
  });

  const handleStateChange = (instance: TaskInstance, newState: TaskState) => {
    const isSameState = instance.state === newState;
    updateTaskInstance(instance.id, isSameState ? "pending" : newState);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground capitalize">{formattedDate}</p>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">{t("filterAll")}</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">{t("filterPending")}</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">{t("filterCompleted")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Streak unlock modal (admin only) */}
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
            A partir de ahora los miembros verán su progreso de días consecutivos y
            recibirán bonificaciones automáticas por mantener la racha.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Bonus de racha</p>
              <p className="text-xs text-orange-600">+50 puntos por 7 días · +100 por 14 días · +250 por 30 días</p>
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
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("noTasks")}
            </CardContent>
          </Card>
        ) : (
          filtered.map((instance) => {
            const task = tasks.find((tk) => tk.id === instance.taskId);
            if (!task) return null;
            return (
              <TaskCard
                key={instance.id}
                instance={instance}
                task={task}
                t={t}
                onStateChange={handleStateChange}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function TaskCard({
  instance,
  task,
  t,
  onStateChange,
}: {
  instance: TaskInstance;
  task: Task;
  t: ReturnType<typeof useTranslations>;
  onStateChange: (instance: TaskInstance, state: TaskState) => void;
}) {
  const stateConfig: Record<TaskState, { color: string; icon: React.ReactNode; label: string }> = {
    completed: {
      color: "border-green-200 bg-green-50/50",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      label: "Completada",
    },
    pending: {
      color: "border-border bg-white",
      icon: <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />,
      label: "Pendiente",
    },
    not_completed: {
      color: "border-red-200 bg-red-50/50",
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      label: "No completada",
    },
    omitted: {
      color: "border-gray-200 bg-gray-50/50",
      icon: <MinusCircle className="w-5 h-5 text-gray-400" />,
      label: "Omitida",
    },
  };

  const config = stateConfig[instance.state];

  return (
    <Card className={cn("border-2 shadow-sm transition-all", config.color)}>
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* State icon */}
          <div className="flex-shrink-0">{config.icon}</div>

          {/* Task info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "font-semibold",
                  instance.state === "omitted" && "line-through text-muted-foreground"
                )}
              >
                {task?.title}
              </span>
              {task?.isRecurring && (
                <Badge variant="secondary" className="text-xs">
                  <RefreshCw className="w-2.5 h-2.5 mr-1" />
                  {t("recurringBadge")}
                </Badge>
              )}
            </div>
            {task?.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-medium text-primary">+{task?.points ?? 0} pts</span>
            </div>
          </div>

          {/* Actions */}
          {instance.state !== "omitted" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant={instance.state === "completed" ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => onStateChange(instance, "completed")}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t("markCompleted")}
              </Button>
              <Button
                size="sm"
                variant={instance.state === "not_completed" ? "destructive" : "ghost"}
                className="h-8 text-xs"
                onClick={() => onStateChange(instance, "not_completed")}
              >
                <XCircle className="w-3 h-3 mr-1" />
                No
              </Button>
            </div>
          )}
          {instance.state === "omitted" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => onStateChange(instance, "pending")}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t("restore")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
