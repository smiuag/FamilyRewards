"use client";

import { useState, useMemo } from "react";
import {
  TASKS_CATALOG,
  TASK_CATEGORIES,
  type TaskCategory,
  type CatalogTask,
} from "@/lib/catalog/tasks-catalog";
import { MOCK_USERS } from "@/lib/mock-data";
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
import { Search, Plus, Check, Star, Users, RefreshCw, Clock, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DIFFICULTY_CONFIG = {
  easy:   { label: "Fácil",   color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  medium: { label: "Normal",  color: "bg-amber-100 text-amber-700",  dot: "bg-amber-500" },
  hard:   { label: "Difícil", color: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};

const DAY_MAP: Record<string, string> = {
  mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D",
};

export default function CatalogTasksClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TaskCategory | "all">("all");
  const [configuringTask, setConfiguringTask] = useState<CatalogTask | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Quick-add form state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [makeRecurring, setMakeRecurring] = useState(false);
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
    setCustomPoints(String(task.suggestedPoints));
  };

  const handleConfirmAdd = () => {
    if (!configuringTask) return;
    if (selectedUsers.length === 0) {
      toast.error("Selecciona al menos un miembro");
      return;
    }
    setAddedIds((prev) => new Set([...prev, configuringTask.id]));
    setConfiguringTask(null);
    toast.success(`"${configuringTask.title}" añadida`, {
      description: `Asignada a ${selectedUsers.length} miembro(s) · ${customPoints || configuringTask.suggestedPoints} pts`,
    });
  };

  const toggleUser = (uid: string) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const categories = Object.entries(TASK_CATEGORIES) as [TaskCategory, typeof TASK_CATEGORIES[TaskCategory]][];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Catálogo de Tareas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Añade tareas predefinidas a tu familia con un solo click
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tareas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category pills */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            🗂️ Todas ({TASKS_CATALOG.length})
          </button>
          {categories.map(([key, cat]) => {
            const count = TASKS_CATALOG.filter((t) => t.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  activeCategory === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.emoji} {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} tarea{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((task) => {
          const isAdded = addedIds.has(task.id);
          const diff = DIFFICULTY_CONFIG[task.difficulty];
          const catConfig = TASK_CATEGORIES[task.category];

          return (
            <Card
              key={task.id}
              className={cn(
                "shadow-sm hover:shadow-md transition-all border-2",
                isAdded ? "border-green-300 bg-green-50/50" : "border-transparent"
              )}
            >
              <CardContent className="pt-4 pb-4">
                {/* Header row */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{task.emoji}</span>
                  <Badge className={cn("text-xs border-0", catConfig.color)}>
                    {catConfig.emoji} {catConfig.label}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm leading-tight mb-1">{task.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                  {task.description}
                </p>

                {/* Suggested days */}
                {task.suggestedDays && task.suggestedDays.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {["mon","tue","wed","thu","fri","sat","sun"].map((d) => (
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
                      <div className="flex items-center gap-0.5 ml-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{task.suggestedTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
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
                  {isAdded ? (
                    <><Check className="w-3.5 h-3.5 mr-1" /> Añadida</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 mr-1" /> Añadir y configurar</>
                  )}
                </Button>
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
                {MOCK_USERS.map((user) => (
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

            {/* Recurring */}
            {configuringTask?.suggestedDays && configuringTask.suggestedDays.length > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tarea recurrente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Días sugeridos: {configuringTask.suggestedDays.map((d) => DAY_MAP[d]).join(" ")}
                  </p>
                </div>
                <Switch checked={makeRecurring} onCheckedChange={setMakeRecurring} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiguringTask(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAdd}>
              <Plus className="w-4 h-4 mr-1.5" />
              Añadir tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
