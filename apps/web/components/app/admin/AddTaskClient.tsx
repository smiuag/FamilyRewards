"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  TASKS_CATALOG,
  TASK_CATEGORIES,
  type TaskCategory,
  type CatalogTask,
} from "@/lib/catalog/tasks-catalog";
import { useAppStore } from "@/lib/store/useAppStore";
import { createTask } from "@/lib/api/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { Search, Plus, Check, Star, Users, RefreshCw, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/types";

const DIFFICULTY_CONFIG = {
  easy:   { label: "Fácil",   color: "bg-green-100 text-green-700" },
  medium: { label: "Normal",  color: "bg-amber-100 text-amber-700" },
  hard:   { label: "Difícil", color: "bg-red-100 text-red-700" },
};
const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_MAP: Record<string, string> = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D" };

type Tab = "catalog" | "custom";

export default function AddTaskClient() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const { users, currentUser } = useAppStore();

  const [tab, setTab] = useState<Tab>("catalog");

  // ── Catalog state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TaskCategory | "all">("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Catalog configure modal
  const [configuringTask, setConfiguringTask] = useState<CatalogTask | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [customPoints, setCustomPoints] = useState("");

  // ── Custom form state ────────────────────────────────────────────────────────
  const [customForm, setCustomForm] = useState({
    title: "", description: "", points: "20", penaltyPoints: "",
    assignedTo: [] as string[],
    isRecurring: false,
    daysOfWeek: [] as DayOfWeek[],
    time: "",
    defaultState: "pending" as "pending" | "completed",
    deadline: "",
  });

  const [saving, setSaving] = useState(false);

  // ── Catalog helpers ──────────────────────────────────────────────────────────
  const categoryLabel =
    activeCategory === "all"
      ? `🗂️ Todas (${TASKS_CATALOG.length})`
      : `${TASK_CATEGORIES[activeCategory as TaskCategory]?.emoji} ${TASK_CATEGORIES[activeCategory as TaskCategory]?.label}`;

  const filtered = useMemo(() => TASKS_CATALOG.filter((t) => {
    const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || t.category === activeCategory;
    return matchSearch && matchCategory;
  }), [search, activeCategory]);

  const categories = Object.entries(TASK_CATEGORIES) as [TaskCategory, typeof TASK_CATEGORIES[TaskCategory]][];

  const openConfigure = (task: CatalogTask) => {
    setConfiguringTask(task);
    setSelectedUsers([]);
    setMakeRecurring(!!task.suggestedDays?.length);
    setSelectedDays((task.suggestedDays ?? []) as DayOfWeek[]);
    setCustomPoints(String(task.suggestedPoints));
  };

  const toggleCatalogUser = (uid: string) =>
    setSelectedUsers((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);

  const toggleDay = (day: DayOfWeek) =>
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  const handleConfirmCatalog = async () => {
    if (!configuringTask) return;
    if (!currentUser?.familyId) return;
    setSaving(true);
    try {
      const recurringPattern = makeRecurring && selectedDays.length > 0
        ? { daysOfWeek: selectedDays, time: configuringTask.suggestedTime, defaultState: "pending" as const }
        : undefined;
      await createTask(currentUser.familyId, currentUser.id, {
        title: configuringTask.title,
        description: configuringTask.description,
        points: parseInt(customPoints) || configuringTask.suggestedPoints,
        assignedTo: selectedUsers,
        isRecurring: makeRecurring && selectedDays.length > 0,
        recurringPattern,
      });
      setAddedIds((prev) => new Set([...prev, configuringTask.id]));
      toast.success(`"${configuringTask.title}" añadida`, {
        description: selectedUsers.length > 0
          ? `Asignada a ${selectedUsers.length} miembro(s) · ${customPoints || configuringTask.suggestedPoints} pts`
          : `Sin asignar (reclamable) · ${customPoints || configuringTask.suggestedPoints} pts`,
      });
      setConfiguringTask(null);
    } catch {
      toast.error("Error al añadir la tarea. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // ── Custom form helpers ──────────────────────────────────────────────────────
  const toggleCustomUser = (userId: string) =>
    setCustomForm((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(userId)
        ? f.assignedTo.filter((id) => id !== userId)
        : [...f.assignedTo, userId],
    }));

  const toggleCustomDay = (day: DayOfWeek) =>
    setCustomForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day],
    }));

  const handleSaveCustom = async () => {
    if (!customForm.title.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!currentUser?.familyId) return;
    setSaving(true);
    const recurringPattern = customForm.isRecurring
      ? { daysOfWeek: customForm.daysOfWeek, time: customForm.time || undefined, defaultState: customForm.defaultState }
      : undefined;
    const defaultState = !customForm.isRecurring ? customForm.defaultState : undefined;
    const deadline = !customForm.isRecurring && customForm.deadline ? customForm.deadline : undefined;
    const penaltyPoints = customForm.penaltyPoints !== "" ? parseInt(customForm.penaltyPoints) : undefined;
    try {
      const newTask = await createTask(currentUser.familyId, currentUser.id, {
        title: customForm.title,
        description: customForm.description,
        points: parseInt(customForm.points) || 10,
        penaltyPoints,
        assignedTo: customForm.assignedTo,
        isRecurring: customForm.isRecurring,
        recurringPattern,
        defaultState,
        deadline,
      });
      useAppStore.setState((prev) => ({ tasks: [...prev.tasks, newTask] }));
      toast.success(`"${customForm.title}" creada`);
      router.push(`/${locale}/admin/tasks`);
    } catch {
      toast.error("Error al guardar la tarea. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Tareas</h1>
        <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/admin/tasks`)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Tareas
        </Button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button onClick={() => setTab("catalog")}
          className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-all",
            tab === "catalog" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
          🗂️ Del catálogo
        </button>
        <button onClick={() => setTab("custom")}
          className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-all",
            tab === "custom" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
          ✏️ Personalizada
        </button>
      </div>

      {/* ── Catalog tab ─────────────────────────────────────────────────────── */}
      {tab === "catalog" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar tareas..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={activeCategory} onValueChange={(v) => setActiveCategory((v ?? "all") as TaskCategory | "all")}>
              <SelectTrigger className="w-52">
                <span className="text-sm truncate">{categoryLabel}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🗂️ Todas ({TASKS_CATALOG.length})</SelectItem>
                {categories.map(([key, cat]) => {
                  const count = TASKS_CATALOG.filter((t) => t.category === key).length;
                  return (
                    <SelectItem key={key} value={key}>
                      {cat.emoji} {cat.label} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} tarea{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((task) => {
              const isAdded = addedIds.has(task.id);
              const diff    = DIFFICULTY_CONFIG[task.difficulty];
              const catConf = TASK_CATEGORIES[task.category];
              return (
                <Card key={task.id}
                  className={cn("shadow-sm hover:shadow-md transition-all border-2 flex flex-col cursor-pointer",
                    isAdded ? "border-green-300 bg-green-50/50 cursor-default" : "border-transparent hover:border-primary/30"
                  )}
                  onClick={() => !isAdded && openConfigure(task)}
                >
                  <CardContent className="pt-4 pb-4 flex flex-col flex-1">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-3xl">{task.emoji}</span>
                        <Badge className={cn("text-xs border-0", catConf.color)}>
                          {catConf.emoji} {catConf.label}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm leading-tight mb-1">{task.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">{task.description}</p>
                      <div className="h-6 flex items-center gap-1 mb-2">
                        {task.suggestedDays && task.suggestedDays.length > 0 ? (
                          <>
                            {ALL_DAYS.map((d) => (
                              <span key={d} className={cn(
                                "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                                task.suggestedDays?.includes(d) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                              )}>{DAY_MAP[d]}</span>
                            ))}
                            {task.suggestedTime && (
                              <span className="flex items-center gap-0.5 ml-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{task.suggestedTime}</span>
                              </span>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                          <span className="font-bold text-primary text-sm">{task.suggestedPoints}</span>
                          <span className="text-xs text-muted-foreground">pts</span>
                        </div>
                        <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", diff.color)}>{diff.label}</span>
                      </div>
                      <div className={cn("h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors",
                        isAdded
                          ? "bg-green-500 text-white"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}>
                        {isAdded
                          ? <><Check className="w-3.5 h-3.5 mr-1" /> Añadida</>
                          : <><Plus className="w-3.5 h-3.5 mr-1" /> Añadir y configurar</>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm">Prueba con otro término o categoría</p>
            </div>
          )}
        </div>
      )}

      {/* ── Custom tab ───────────────────────────────────────────────────────── */}
      {tab === "custom" && (
        <div className="max-w-md space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={customForm.title} onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
              placeholder="Nombre de la tarea" className="mt-1.5" autoFocus />
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input value={customForm.description} onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
              placeholder="Breve descripción" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Puntos al completar</Label>
              <Input type="number" value={customForm.points}
                onChange={(e) => setCustomForm({ ...customForm, points: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>Descuento si no se hace</Label>
              <Input type="number" value={customForm.penaltyPoints} min={0}
                onChange={(e) => setCustomForm({ ...customForm, penaltyPoints: e.target.value })}
                placeholder={`Por defecto ${customForm.points || "0"}`} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Asignada a</Label>
            <div className="flex gap-2 flex-wrap">
              {users.map((u) => (
                <button key={u.id} onClick={() => toggleCustomUser(u.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all",
                    customForm.assignedTo.includes(u.id)
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
            <Switch checked={customForm.isRecurring}
              onCheckedChange={(v) => setCustomForm({ ...customForm, isRecurring: v })} />
          </div>
          {!customForm.isRecurring && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha límite (opcional)</Label>
                <Input type="date" value={customForm.deadline}
                  onChange={(e) => setCustomForm({ ...customForm, deadline: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Estado por defecto</Label>
                <Select value={customForm.defaultState}
                  onValueChange={(v) => setCustomForm({ ...customForm, defaultState: v as "pending" | "completed" })}>
                  <SelectTrigger className="mt-1.5">
                    <span>{customForm.defaultState === "pending" ? "Pendiente" : "Completada"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {customForm.isRecurring && (
            <>
              <div>
                <Label className="mb-2 block">Días de la semana</Label>
                <div className="flex gap-1.5">
                  {ALL_DAYS.map((d) => (
                    <button key={d} onClick={() => toggleCustomDay(d)}
                      className={cn("w-9 h-9 rounded-xl text-sm font-bold transition-all",
                        customForm.daysOfWeek.includes(d)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground")}>
                      {DAY_MAP[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hora (opcional)</Label>
                  <Input type="time" value={customForm.time}
                    onChange={(e) => setCustomForm({ ...customForm, time: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Estado por defecto</Label>
                  <Select value={customForm.defaultState}
                    onValueChange={(v) => setCustomForm({ ...customForm, defaultState: v as "pending" | "completed" })}>
                    <SelectTrigger className="mt-1.5">
                      <span>{customForm.defaultState === "pending" ? "Pendiente" : "Completada"}</span>
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
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push(`/${locale}/admin/tasks`)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustom} disabled={saving || !customForm.title.trim()}>
              <Plus className="w-4 h-4 mr-1.5" />
              {saving ? "Creando..." : "Crear tarea"}
            </Button>
          </div>
        </div>
      )}

      {/* Configure catalog task modal */}
      <AppModal open={!!configuringTask} onOpenChange={() => setConfiguringTask(null)}>
        <AppModalHeader
          emoji={configuringTask?.emoji}
          title={configuringTask?.title ?? ""}
          description={configuringTask?.description}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          onClose={() => setConfiguringTask(null)}
        />
        <AppModalBody>
          <div>
            <Label className="mb-2 block">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              Asignar a
            </Label>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <button key={user.id} onClick={() => toggleCatalogUser(user.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                    selectedUsers.includes(user.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}>
                  <span>{user.avatar}</span>
                  <span>{user.name}</span>
                  {selectedUsers.includes(user.id) && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">
              <Star className="w-3.5 h-3.5 inline mr-1 text-primary" />
              Puntos por completar
            </Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value)} className="w-28" />
              <span className="text-sm text-muted-foreground">Sugerido: {configuringTask?.suggestedPoints} pts</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Tarea recurrente
              </p>
              <p className="text-xs text-muted-foreground">Se repite en los días elegidos</p>
            </div>
            <Switch checked={makeRecurring} onCheckedChange={(v) => {
              setMakeRecurring(v);
              if (v && selectedDays.length === 0) setSelectedDays((configuringTask?.suggestedDays ?? []) as DayOfWeek[]);
            }} />
          </div>
          {makeRecurring && (
            <div>
              <Label className="mb-2 block">Días de la semana</Label>
              <div className="flex gap-1.5">
                {ALL_DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={cn("w-9 h-9 rounded-xl text-sm font-bold transition-all",
                      selectedDays.includes(d)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70")}>
                    {DAY_MAP[d]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setConfiguringTask(null)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleConfirmCatalog} disabled={saving}>
            <Plus className="w-4 h-4 mr-1.5" />
            {saving ? "Añadiendo..." : "Añadir tarea"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
