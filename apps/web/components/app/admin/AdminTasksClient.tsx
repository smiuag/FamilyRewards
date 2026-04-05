"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Star, Users, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Task, DayOfWeek } from "@/lib/types";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D",
};
const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const emptyForm = () => ({
  title: "",
  description: "",
  points: "20",
  assignedTo: [] as string[],
  isRecurring: false,
  daysOfWeek: [] as DayOfWeek[],
  time: "",
  defaultState: "pending" as "pending" | "completed",
});

export default function AdminTasksClient() {
  const { tasks: storeTasks, users, addTask, updateTask } = useAppStore();
  const [filterMember, setFilterMember] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm());

  const toggleTask = (taskId: string) => {
    const t = storeTasks.find((t) => t.id === taskId);
    if (t) updateTask(taskId, { isActive: !t.isActive });
  };

  const openNew = () => {
    setEditingTask(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      points: String(task.points),
      assignedTo: task.assignedTo,
      isRecurring: task.isRecurring,
      daysOfWeek: task.recurringPattern?.daysOfWeek ?? [],
      time: task.recurringPattern?.time ?? "",
      defaultState: task.recurringPattern?.defaultState ?? "pending",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (editingTask) {
      updateTask(editingTask.id, {
        title: form.title,
        description: form.description,
        points: parseInt(form.points) || 10,
        assignedTo: form.assignedTo,
        isRecurring: form.isRecurring,
        recurringPattern: form.isRecurring
          ? { daysOfWeek: form.daysOfWeek, time: form.time || undefined, defaultState: form.defaultState }
          : undefined,
      });
      toast.success(`Tarea "${form.title}" actualizada`);
    } else {
      addTask({
        title: form.title,
        description: form.description,
        points: parseInt(form.points) || 10,
        assignedTo: form.assignedTo,
        createdBy: users.find((u) => u.role === "admin")?.id ?? "u1",
        isRecurring: form.isRecurring,
        recurringPattern: form.isRecurring
          ? { daysOfWeek: form.daysOfWeek, time: form.time || undefined, defaultState: form.defaultState }
          : undefined,
        isActive: true,
      });
      toast.success(`Tarea "${form.title}" creada`);
    }
    setOpen(false);
  };

  const toggleDay = (day: DayOfWeek) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day],
    }));
  };

  const toggleUser = (userId: string) => {
    setForm((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(userId)
        ? f.assignedTo.filter((id) => id !== userId)
        : [...f.assignedTo, userId],
    }));
  };

  const getAssignedNames = (userIds: string[]) =>
    userIds
      .map((id) => users.find((u) => u.id === id)?.name ?? "?")
      .join(", ");

  const visibleTasks = filterMember === "all"
    ? storeTasks
    : storeTasks.filter((t) => t.assignedTo.includes(filterMember));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Tareas</h1>
        <div className="flex items-center gap-2">
          <Select value={filterMember} onValueChange={(v) => setFilterMember(v ?? "all")}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Todos los miembros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los miembros</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.avatar} {u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nueva tarea
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleTasks.map((task) => (
          <Card
            key={task.id}
            className={cn("shadow-sm transition-all", !task.isActive && "opacity-60")}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
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

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => openEdit(task)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  {task.isRecurring && (
                    <Switch
                      checked={task.isActive}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New / Edit task modal */}
      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalHeader
          emoji="✅"
          title={editingTask ? `Editar: ${editingTask.title}` : "Nueva tarea"}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          onClose={() => setOpen(false)}
        />
        <AppModalBody className="overflow-y-auto max-h-[60dvh]">
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nombre de la tarea"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Puntos</Label>
              <Input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                className="mt-1.5"
              />
            </div>

            {/* Assigned users */}
            <div>
              <Label className="mb-2 block">Asignada a</Label>
              <div className="flex gap-2 flex-wrap">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all",
                      form.assignedTo.includes(u.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-transparent text-muted-foreground"
                    )}
                  >
                    <span>{u.avatar}</span>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium">Tarea recurrente</p>
                <p className="text-xs text-muted-foreground">Se repite según el patrón</p>
              </div>
              <Switch
                checked={form.isRecurring}
                onCheckedChange={(v) => setForm({ ...form, isRecurring: v })}
              />
            </div>

            {form.isRecurring && (
              <>
                <div>
                  <Label className="mb-2 block">Días de la semana</Label>
                  <div className="flex gap-1.5">
                    {ALL_DAYS.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={cn(
                          "w-9 h-9 rounded-xl text-sm font-bold transition-all",
                          form.daysOfWeek.includes(d)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {DAY_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hora (opcional)</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Estado por defecto</Label>
                    <Select
                      value={form.defaultState}
                      onValueChange={(v) =>
                        setForm({ ...form, defaultState: v as "pending" | "completed" })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{editingTask ? "Guardar cambios" : "Crear tarea"}</Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
