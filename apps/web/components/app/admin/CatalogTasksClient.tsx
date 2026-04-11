"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Search, Plus, Check, Star, Users, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/types";

import { DIFFICULTY_CONFIG, ALL_DAYS, DAY_LABELS as DAY_MAP } from "@/lib/config/constants";

export default function CatalogTasksClient() {
  const { setupVisited, markSetupVisited, users, currentUser } = useAppStore();
  useEffect(() => { markSetupVisited("catalogTasks"); }, []);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TaskCategory | "all">("all");
  const [configuringTask, setConfiguringTask] = useState<CatalogTask | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Dialog form state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [customPoints, setCustomPoints] = useState("");

  const filtered = useMemo(() => {
    return TASKS_CATALOG.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === "all" || t.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [search, activeCategory]);

  const openConfigure = (task: CatalogTask) => {
    setConfiguringTask(task);
    setSelectedUsers([]);
    setMakeRecurring(!!task.suggestedDays?.length);
    setSelectedDays((task.suggestedDays ?? []) as DayOfWeek[]);
    setCustomPoints(String(task.suggestedPoints));
  };

  const toggleDay = (day: DayOfWeek) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleConfirmAdd = async () => {
    if (!configuringTask) return;
    if (selectedUsers.length === 0) { toast.error("Selecciona al menos un miembro"); return; }
    if (!currentUser?.familyId) { toast.error("No se pudo determinar la familia"); return; }
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
      setConfiguringTask(null);
      toast.success(`"${configuringTask.title}" añadida`, {
        description: `Asignada a ${selectedUsers.length} miembro(s) · ${customPoints || configuringTask.suggestedPoints} pts`,
      });
    } catch {
      toast.error("Error al añadir la tarea. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = (uid: string) =>
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );

  const categories = Object.entries(TASK_CATEGORIES) as [TaskCategory, typeof TASK_CATEGORIES[TaskCategory]][];

  // Display label for the category select trigger
  const categoryLabel =
    activeCategory === "all"
      ? `🗂️ Todas (${TASKS_CATALOG.length})`
      : `${TASK_CATEGORIES[activeCategory as TaskCategory]?.emoji} ${TASK_CATEGORIES[activeCategory as TaskCategory]?.label}`;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Catálogo de Tareas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Añade tareas predefinidas a tu familia con un solo click
        </p>
      </div>

      {!setupVisited.catalogTasks && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 space-y-1">
          <p className="font-semibold text-orange-800 text-sm">📋 Añade tareas a tu familia</p>
          <p className="text-sm text-orange-700">
            Explora el catálogo y añade las tareas que quieras. Podrás ajustar los puntos y asignarlas
            a cada miembro desde <strong>Administración → Tareas</strong>.
          </p>
        </div>
      )}

      {/* Search + category filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={activeCategory} onValueChange={(v) => setActiveCategory((v ?? "all") as TaskCategory | "all")}>
          <SelectTrigger className="w-48">
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

      {/* Grid — cards use flex-col so footer always aligns */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((task) => {
          const isAdded = addedIds.has(task.id);
          const diff = DIFFICULTY_CONFIG[task.difficulty];
          const catConfig = TASK_CATEGORIES[task.category];

          return (
            <Card
              key={task.id}
              className={cn(
                "shadow-sm hover:shadow-md transition-all border-2 flex flex-col",
                isAdded ? "border-green-300 bg-green-50/50" : "border-transparent"
              )}
            >
              <CardContent className="pt-4 pb-4 flex flex-col flex-1">
                {/* Top section grows */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{task.emoji}</span>
                    <Badge className={cn("text-xs border-0", catConfig.color)}>
                      {catConfig.emoji} {catConfig.label}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-1">{task.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">
                    {task.description}
                  </p>

                  {/* Days row — always reserves space (hidden placeholder when no days) */}
                  <div className="h-6 flex items-center gap-1 mb-2">
                    {task.suggestedDays && task.suggestedDays.length > 0 ? (
                      <>
                        {ALL_DAYS.map((d) => (
                          <span
                            key={d}
                            className={cn(
                              "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                              task.suggestedDays?.includes(d)
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground/40"
                            )}
                          >
                            {DAY_MAP[d]}
                          </span>
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

                {/* Bottom section always at same position */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                      <span className="font-bold text-primary text-sm">{task.suggestedPoints}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", diff.color)}>
                      {diff.label}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className={cn("w-full h-8 text-xs", isAdded && "bg-green-500 hover:bg-green-600")}
                    onClick={() => !isAdded && openConfigure(task)}
                    disabled={isAdded}
                  >
                    {isAdded
                      ? <><Check className="w-3.5 h-3.5 mr-1" /> Añadida</>
                      : <><Plus className="w-3.5 h-3.5 mr-1" /> Añadir y configurar</>}
                  </Button>
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

      {/* Configure dialog */}
      <Dialog open={!!configuringTask} onOpenChange={() => setConfiguringTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{configuringTask?.emoji}</span>
              {configuringTask?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Assign to */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Asignar a
              </Label>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                      selectedUsers.includes(user.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <span>{user.avatar}</span>
                    <span>{user.name}</span>
                    {selectedUsers.includes(user.id) && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Points */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                <Star className="w-3.5 h-3.5 inline mr-1 text-primary" />
                Puntos por completar
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="w-28"
                />
                <span className="flex items-center text-sm text-muted-foreground">
                  Sugerido: {configuringTask?.suggestedPoints} pts
                </span>
              </div>
            </div>

            {/* Recurring toggle — always visible */}
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tarea recurrente
                </p>
                <p className="text-xs text-muted-foreground">Se repite en los días elegidos</p>
              </div>
              <Switch checked={makeRecurring} onCheckedChange={(v) => { setMakeRecurring(v); if (v && selectedDays.length === 0) setSelectedDays((configuringTask?.suggestedDays ?? []) as DayOfWeek[]); }} />
            </div>

            {/* Day picker — shown when recurring */}
            {makeRecurring && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">Días de la semana</Label>
                <div className="flex gap-1.5">
                  {ALL_DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-sm font-bold transition-all",
                        selectedDays.includes(d)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      {DAY_MAP[d]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguringTask(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAdd} disabled={saving}>
              <Plus className="w-4 h-4 mr-1.5" />
              {saving ? "Añadiendo..." : "Añadir tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
