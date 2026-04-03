"use client";

import { useState } from "react";
import { MOCK_TASKS, MOCK_USERS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, RefreshCw, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/types";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D",
};
const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function AdminTasksClient() {
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const getAssignedNames = (userIds: string[]) =>
    userIds
      .map((id) => MOCK_USERS.find((u) => u.id === id)?.name ?? "?")
      .join(", ");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Gestión de Tareas</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva tarea
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "shadow-sm transition-all",
              !task.isActive && "opacity-60"
            )}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    task.isRecurring ? "bg-blue-100" : "bg-orange-100"
                  )}
                >
                  {task.isRecurring ? (
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Star className="w-5 h-5 text-orange-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{task.title}</span>
                    {task.isRecurring && (
                      <Badge variant="secondary" className="text-xs">
                        <RefreshCw className="w-2.5 h-2.5 mr-1" />
                        Recurrente
                      </Badge>
                    )}
                    {!task.isActive && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Desactivada
                      </Badge>
                    )}
                  </div>

                  {/* Recurring pattern */}
                  {task.isRecurring && task.recurringPattern && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        {ALL_DAYS.map((d) => (
                          <span
                            key={d}
                            className={cn(
                              "w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center",
                              task.recurringPattern?.daysOfWeek.includes(d)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {DAY_LABELS[d]}
                          </span>
                        ))}
                      </div>
                      {task.recurringPattern.time && (
                        <span className="text-xs text-muted-foreground">
                          {task.recurringPattern.time}
                          {task.recurringPattern.durationHours &&
                            ` · ${task.recurringPattern.durationHours}h`}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border-0",
                          task.recurringPattern.defaultState === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        Por defecto:{" "}
                        {task.recurringPattern.defaultState === "completed"
                          ? "completada"
                          : "pendiente"}
                      </Badge>
                    </div>
                  )}

                  {/* Assigned & points */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {getAssignedNames(task.assignedTo)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-primary font-semibold">{task.points} pts</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Editar
                  </Button>
                  {task.isRecurring && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={task.isActive}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
