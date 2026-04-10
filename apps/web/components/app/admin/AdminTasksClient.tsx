"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks, createTask, updateTask, deleteTask } from "@/lib/api/tasks";
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
import { Plus, RefreshCw, Star, Users, Pencil, Trash2 } from "lucide-react";
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
  penaltyPoints: "",
  assignedTo: [] as string[],
  isRecurring: false,
  daysOfWeek: [] as DayOfWeek[],
  time: "",
  defaultState: "pending" as "pending" | "completed",
  deadline: "",
});

export default function AdminTasksClient() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const { tasks: storeTasks, users, currentUser, loadTasks, updateTask: storeUpdateTask, deleteTask: storeDeleteTask } = useAppStore();
  const [filterMember, setFilterMember] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFamilyTasks()
      .then(loadTasks)
      .catch(() => toast.error("Error al cargar las tareas"))
      .finally(() => setLoadingTasks(false));
  }, []);

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    storeDeleteTask(taskToDelete.id);
    try {
      await deleteTask(taskToDelete.id);
      toast.success(`Tarea "${taskToDelete.title}" eliminada`);
    } catch {
      // Re-add on error is complex; just notify
      toast.error("Error al eliminar la tarea");
    } finally {
      setDeleting(false);
      setTaskToDelete(null);
    }
  };

  const toggleActive = async (task: Task) => {
    storeUpdateTask(task.id, { isActive: !task.isActive });
    try {
      await updateTask(task.id, { isActive: !task.isActive });
    } catch {
      storeUpdateTask(task.id, { isActive: task.isActive }); // rollback
      toast.error("Error al actualizar la tarea");
    }
  };



  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      points: String(task.points),
      penaltyPoints: task.penaltyPoints !== undefined ? String(task.penaltyPoints) : "",
      assignedTo: task.assignedTo,
      isRecurring: task.isRecurring,
      daysOfWeek: task.recurringPattern?.daysOfWeek ?? [],
      time: task.recurringPattern?.time ?? "",
      defaultState: task.recurringPattern?.defaultState ?? "pending",
      deadline: task.deadline ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    const recurringPattern = form.isRecurring
      ? { daysOfWeek: form.daysOfWeek, time: form.time || undefined, defaultState: form.defaultState }
      : undefined;
    const defaultState = !form.isRecurring ? form.defaultState : undefined;
    const deadline = !form.isRecurring && form.deadline ? form.deadline : undefined;
    const penaltyPoints = form.penaltyPoints !== "" ? parseInt(form.penaltyPoints) : undefined;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: form.title,
          description: form.description,
          points: parseInt(form.points) || 10,
          penaltyPoints: penaltyPoints ?? null,
          assignedTo: form.assignedTo,
          isRecurring: form.isRecurring,
          recurringPattern,
          defaultState,
          deadline: deadline ?? null,
        });
        storeUpdateTask(editingTask.id, {
          title: form.title,
          description: form.description,
          points: parseInt(form.points) || 10,
          penaltyPoints,
          assignedTo: form.assignedTo,
          isRecurring: form.isRecurring,
          recurringPattern,
          defaultState,
          deadline,
        });
        toast.success(`Tarea "${form.title}" actualizada`);
      } else {
        if (!currentUser?.familyId) throw new Error("No family");
        const newTask = await createTask(currentUser.familyId, currentUser.id, {
          title: form.title,
          description: form.description,
          points: parseInt(form.points) || 10,
          penaltyPoints,
          assignedTo: form.assignedTo,
          isRecurring: form.isRecurring,
          recurringPattern,
          defaultState,
          deadline,
        });
        useAppStore.setState((prev) => ({ tasks: [...prev.tasks, newTask] }));
        toast.success(`Tarea "${form.title}" creada`);
      }
      setOpen(false);
    } catch {
      toast.error("Error al guardar la tarea. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: DayOfWeek) =>
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day],
    }));

  const toggleUser = (userId: string) =>
    setForm((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(userId)
        ? f.assignedTo.filter((id) => id !== userId)
        : [...f.assignedTo, userId],
    }));

  const getAssignedNames = (userIds: string[]) =>
    userIds.map((id) => users.find((u) => u.id === id)?.name ?? "?").join(", ");

  const visibleTasks = filterMember === "all"
    ? storeTasks
    : filterMember === "unassigned"
    ? storeTasks.filter((t) => t.assignedTo.length === 0)
    : storeTasks.filter((t) => t.assignedTo.includes(filterMember));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Tareas</h1>
        <div className="flex items-center gap-2">
          <Select value={filterMember} onValueChange={(v) => setFilterMember(v ?? "all")}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <span className="text-sm truncate">
                {filterMember === "all"
                  ? "Todos los miembros"
                  : filterMember === "unassigned"
                  ? "🙋 Sin asignar"
                  : (() => { const u = users.find((u) => u.id === filterMember); return u ? `${u.avatar} ${u.name}` : "Todos"; })()}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los miembros</SelectItem>
              <SelectItem value="unassigned">🙋 Sin asignar</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.avatar} {u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => router.push(`/${locale}/admin/tasks/add`)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Añadir tarea
          </Button>
        </div>
      </div>

      {loadingTasks ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Sin tareas</p>
          <p className="text-sm">Crea una tarea o añade desde el catálogo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <Card key={task.id} className={cn("shadow-sm transition-all", !task.isActive && "opacity-60")}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Type icon */}
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    task.isRecurring ? "bg-blue-100" : "bg-orange-100")}>
                    {task.isRecurring
                      ? <RefreshCw className="w-5 h-5 text-blue-500" />
                      : <Star className="w-5 h-5 text-orange-500" />}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{task.title}</span>
                      {!task.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Desactivada</Badge>
                      )}
                    </div>

                    {task.isRecurring && task.recurringPattern && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                          {ALL_DAYS.map((d) => (
                            <span key={d} className={cn(
                              "w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center",
                              task.recurringPattern?.daysOfWeek.includes(d)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}>{DAY_LABELS[d]}</span>
                          ))}
                        </div>
                        {task.recurringPattern.time && (
                          <span className="text-xs text-muted-foreground">{task.recurringPattern.time}</span>
                        )}
                        <Badge variant="outline" className={cn("text-xs border-0",
                          task.recurringPattern.defaultState === "completed"
                            ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                          Por defecto: {task.recurringPattern.defaultState === "completed" ? "completada" : "pendiente"}
                        </Badge>
                      </div>
                    )}

                    {/* Assigned + points */}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-sm">
                        {task.assignedTo.length > 0
                          ? task.assignedTo.map((uid) => {
                              const u = users.find((u) => u.id === uid);
                              return u ? (
                                <span key={uid} className="flex items-center gap-1">
                                  <span className="text-base">{u.avatar}</span>
                                  <span className="font-medium text-foreground">{u.name}</span>
                                </span>
                              ) : null;
                            })
                          : <span className="text-muted-foreground">Sin asignar</span>
                        }
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="text-primary font-semibold">{task.points} pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Right actions column */}
                  <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0 self-stretch">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(task)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setTaskToDelete(task)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {task.isRecurring && (
                      <Switch checked={task.isActive} onCheckedChange={() => toggleActive(task)} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <AppModal open={!!taskToDelete} onOpenChange={(v) => { if (!v) setTaskToDelete(null); }}>
        <AppModalHeader
          emoji="🗑️"
          title="Eliminar tarea"
          color="bg-gradient-to-br from-red-500 to-rose-600"
          onClose={() => setTaskToDelete(null)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong className="text-foreground">{taskToDelete?.title}</strong>?
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            La tarea desaparecerá de la lista pero se mantendrá en el historial, informes y puntos anteriores.
          </p>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </AppModalFooter>
      </AppModal>

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
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nombre de la tarea" className="mt-1.5" autoFocus />
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descripción" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Puntos al completar</Label>
              <Input type="number" value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Descuento si no se hace</Label>
              <Input type="number" value={form.penaltyPoints} min={0}
                onChange={(e) => setForm({ ...form, penaltyPoints: e.target.value })}
                placeholder={`Por defecto ${form.points || "0"}`} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Asignada a</Label>
            <div className="flex gap-2 flex-wrap">
              {users.map((u) => (
                <button key={u.id} onClick={() => toggleUser(u.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all",
                    form.assignedTo.includes(u.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-transparent text-muted-foreground")}>
                  <span>{u.avatar}</span>{u.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Tarea recurrente</p>
              <p className="text-xs text-muted-foreground">Se repite según el patrón</p>
            </div>
            <Switch checked={form.isRecurring} onCheckedChange={(v) => setForm({ ...form, isRecurring: v })} />
          </div>
          {!form.isRecurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha límite (opcional)</Label>
                <Input type="date" value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Estado por defecto</Label>
                <Select value={form.defaultState}
                  onValueChange={(v) => setForm({ ...form, defaultState: v as "pending" | "completed" })}>
                  <SelectTrigger className="mt-1.5">
                    <span>{form.defaultState === "pending" ? "Pendiente" : "Completada"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {form.isRecurring && (
            <>
              <div>
                <Label className="mb-2 block">Días de la semana</Label>
                <div className="flex gap-1.5">
                  {ALL_DAYS.map((d) => (
                    <button key={d} onClick={() => toggleDay(d)}
                      className={cn("w-9 h-9 rounded-xl text-sm font-bold transition-all",
                        form.daysOfWeek.includes(d)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground")}>
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hora (opcional)</Label>
                  <Input type="time" value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Estado por defecto</Label>
                  <Select value={form.defaultState}
                    onValueChange={(v) => setForm({ ...form, defaultState: v as "pending" | "completed" })}>
                    <SelectTrigger className="mt-1.5">
                      <span>{form.defaultState === "pending" ? "Pendiente" : "Completada"}</span>
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
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? "Guardando..." : editingTask ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
