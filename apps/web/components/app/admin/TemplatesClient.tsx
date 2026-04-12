"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks } from "@/lib/api/tasks";
import {
  fetchFamilyTemplates,
  createTemplate,
  saveCurrentConfigAsTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
} from "@/lib/api/templates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AppModal,
  AppModalHeader,
  AppModalBody,
  AppModalFooter,
} from "@/components/ui/app-modal";
import {
  Plus,
  Save,
  Check,
  ChevronDown,
  Users,
  Pencil,
  Trash2,
  Play,
  Star,
  Info,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskTemplate, TaskTemplateItem, Task, DayOfWeek, RecurringPattern } from "@/lib/types";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D",
};
const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TEMPLATE_EMOJIS = ["📋", "📚", "☀️", "🎒", "❄️", "🌸", "🎄", "📝", "🏖️", "🏫", "⚽", "🎮"];

type ItemForm = {
  title: string;
  description: string;
  points: string;
  penaltyPoints: string;
  daysOfWeek: DayOfWeek[];
  defaultState: "pending" | "completed";
};

const emptyItemForm = (): ItemForm => ({
  title: "",
  description: "",
  points: "20",
  penaltyPoints: "",
  daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
  defaultState: "pending",
});

export default function TemplatesClient() {
  const { tasks: storeTasks, users, currentUser, loadTasks } = useAppStore();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Save current config modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveEmoji, setSaveEmoji] = useState("📋");
  const [saving, setSaving] = useState(false);

  // Create/Edit template modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEmoji, setEditEmoji] = useState("📋");
  const [editItems, setEditItems] = useState<ItemForm[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Apply modal
  const [applyingTemplate, setApplyingTemplate] = useState<TaskTemplate | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<TaskTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const members = users.filter((u) => u.role === "member");
  const activeRecurring = storeTasks.filter((t) => t.isRecurring && t.isActive);

  useEffect(() => {
    Promise.all([
      fetchFamilyTemplates(),
      fetchFamilyTasks(),
    ]).then(([tmpl, tasks]) => {
      setTemplates(tmpl);
      loadTasks(tasks);
    }).catch(() => toast.error("Error al cargar datos"))
      .finally(() => setLoading(false));
  }, []);

  // ── Save current config ──────────────────────────────────

  const openSaveModal = () => {
    setSaveName("");
    setSaveDescription("");
    setSaveEmoji("📋");
    setShowSaveModal(true);
  };

  const handleSaveCurrentConfig = async () => {
    if (!saveName.trim()) { toast.error("Escribe un nombre para la plantilla"); return; }
    const familyId = currentUser?.familyId;
    const adminId = currentUser?.id;
    if (!familyId || !adminId) return;

    setSaving(true);
    try {
      const template = await saveCurrentConfigAsTemplate(
        familyId, adminId, saveName.trim(), saveDescription.trim(), saveEmoji, storeTasks
      );
      setTemplates((prev) => [...prev, template]);
      toast.success(`Plantilla "${saveName}" guardada con ${template.items.length} tareas`);
      setShowSaveModal(false);
    } catch {
      toast.error("Error al guardar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  // ── Create / Edit template ───────────────────────────────

  const openCreateModal = () => {
    setEditingTemplate(null);
    setEditName("");
    setEditDescription("");
    setEditEmoji("📋");
    setEditItems([emptyItemForm()]);
    setShowEditModal(true);
  };

  const openEditModal = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditDescription(template.description ?? "");
    setEditEmoji(template.emoji);
    setEditItems(
      template.items.map((item) => ({
        title: item.title,
        description: item.description ?? "",
        points: String(item.points),
        penaltyPoints: item.penaltyPoints != null ? String(item.penaltyPoints) : "",
        daysOfWeek: item.recurringPattern.daysOfWeek,
        defaultState: item.recurringPattern.defaultState,
      }))
    );
    setShowEditModal(true);
  };

  const updateItemForm = (index: number, patch: Partial<ItemForm>) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleItemDay = (index: number, day: DayOfWeek) => {
    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const days = item.daysOfWeek.includes(day)
          ? item.daysOfWeek.filter((d) => d !== day)
          : [...item.daysOfWeek, day];
        return { ...item, daysOfWeek: days };
      })
    );
  };

  const handleSaveTemplate = async () => {
    if (!editName.trim()) { toast.error("Escribe un nombre para la plantilla"); return; }
    const validItems = editItems.filter((item) => item.title.trim() && item.daysOfWeek.length > 0);
    if (validItems.length === 0) {
      toast.error("Añade al menos una tarea con días asignados");
      return;
    }

    const familyId = currentUser?.familyId;
    const adminId = currentUser?.id;
    if (!familyId || !adminId) return;

    const itemsData = validItems.map((item) => ({
      title: item.title.trim(),
      description: item.description.trim() || undefined,
      points: parseInt(item.points) || 0,
      recurringPattern: {
        daysOfWeek: item.daysOfWeek,
        defaultState: item.defaultState,
      } as RecurringPattern,
      penaltyPoints: item.penaltyPoints ? parseInt(item.penaltyPoints) : undefined,
    }));

    setEditSaving(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: editName.trim(),
          description: editDescription.trim(),
          emoji: editEmoji,
          items: itemsData,
        });
        // Refresh the template list
        const updated = await fetchFamilyTemplates();
        setTemplates(updated);
        toast.success(`Plantilla "${editName}" actualizada`);
      } else {
        const created = await createTemplate(familyId, adminId, {
          name: editName.trim(),
          description: editDescription.trim(),
          emoji: editEmoji,
          items: itemsData,
        });
        setTemplates((prev) => [...prev, created]);
        toast.success(`Plantilla "${editName}" creada con ${created.items.length} tareas`);
      }
      setShowEditModal(false);
    } catch {
      toast.error("Error al guardar la plantilla");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Apply template ───────────────────────────────────────

  const openApplyModal = (template: TaskTemplate) => {
    setApplyingTemplate(template);
    setSelectedMembers(members.map((u) => u.id));
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleApply = async () => {
    if (!applyingTemplate) return;
    if (selectedMembers.length === 0) {
      toast.error("Selecciona al menos un miembro");
      return;
    }
    const familyId = currentUser?.familyId;
    const adminId = currentUser?.id;
    if (!familyId || !adminId) return;

    setApplying(true);
    try {
      const createdTasks = await applyTemplate(
        applyingTemplate, familyId, adminId, selectedMembers, storeTasks
      );

      // Update store: deactivate old recurring, add new tasks
      useAppStore.setState((prev) => ({
        tasks: [
          ...prev.tasks.map((t) =>
            t.isRecurring && t.isActive ? { ...t, isActive: false } : t
          ),
          ...createdTasks,
        ],
      }));

      toast.success(`Plantilla "${applyingTemplate.name}" aplicada`, {
        description: `${createdTasks.length} tareas recurrentes activadas. Las anteriores se han desactivado.`,
      });
      setApplyingTemplate(null);
    } catch {
      toast.error("Error al aplicar la plantilla");
    } finally {
      setApplying(false);
    }
  };

  // ── Delete template ──────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTemplate(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success(`Plantilla "${deleteTarget.name}" eliminada`);
    } catch {
      toast.error("Error al eliminar la plantilla");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Render helpers ───────────────────────────────────────

  const formatDays = (days: DayOfWeek[]) =>
    ALL_DAYS.filter((d) => days.includes(d)).map((d) => DAY_LABELS[d]).join(" ");

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Plantillas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configuraciones guardadas de tareas recurrentes para tu familia
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Que son las plantillas?</p>
          <p>
            Una plantilla guarda una configuración de <strong>tareas recurrentes</strong> (las que se repiten cada semana).
            Puedes tener plantillas distintas para cada temporada (curso escolar, verano, exámenes...) y cambiar
            entre ellas fácilmente.
          </p>
          <p className="text-blue-600">
            Las tareas puntuales (no recurrentes) y las recompensas <strong>no se ven afectadas</strong> al aplicar una plantilla.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={openSaveModal} disabled={activeRecurring.length === 0}>
          <Save className="w-4 h-4 mr-1.5" />
          Guardar config. actual
          {activeRecurring.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">{activeRecurring.length}</Badge>
          )}
        </Button>
        <Button size="sm" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva plantilla
        </Button>
      </div>

      {/* Templates list */}
      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No hay plantillas guardadas</p>
            <p className="text-sm mt-1">
              Guarda tu configuración actual o crea una nueva plantilla desde cero.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const isExpanded = expandedId === template.id;

            return (
              <Card
                key={template.id}
                className="shadow-sm border transition-all overflow-hidden"
              >
                <CardContent className="pt-5 pb-4">
                  <div
                    className="flex items-center gap-4 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-primary rounded-lg"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isExpanded ? null : template.id); } }}
                  >
                    <div className="text-4xl flex-shrink-0">{template.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h2 className="font-extrabold text-lg">{template.name}</h2>
                        <Badge variant="secondary" className="text-xs">
                          {template.items.length} tareas
                        </Badge>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditModal(template)}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(template)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" className="h-8 text-xs" onClick={() => openApplyModal(template)}>
                        <Play className="w-3.5 h-3.5 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: show items */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="space-y-2">
                        {template.items.map((item, i) => (
                          <div
                            key={item.id ?? i}
                            className="flex items-center gap-3 text-sm bg-muted/50 rounded-lg px-3 py-2"
                          >
                            <span className="flex-1 font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDays(item.recurringPattern.daysOfWeek)}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              <span className="text-xs font-bold text-primary">{item.points}</span>
                            </div>
                          </div>
                        ))}
                        {template.items.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Esta plantilla no tiene tareas
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Save current config modal ─────────────────────── */}
      <AppModal open={showSaveModal} onOpenChange={setShowSaveModal}>
        <AppModalHeader
          emoji="💾"
          title="Guardar configuración actual"
          description={`${activeRecurring.length} tareas recurrentes activas`}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={() => setShowSaveModal(false)}
        />
        <AppModalBody>
          <div>
            <Label className="mb-1.5 block">Nombre</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ej: Curso escolar 2026"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Descripción (opcional)</Label>
            <Input
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Ej: Configuración de tareas para días de clase"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Icono</Label>
            <div className="flex gap-1.5 flex-wrap">
              {TEMPLATE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSaveEmoji(emoji)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all",
                    saveEmoji === emoji
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-transparent hover:border-border"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Se guardarán estas tareas:</p>
            {activeRecurring.map((t) => (
              <p key={t.id}>• {t.title} ({formatDays(t.recurringPattern?.daysOfWeek ?? [])})</p>
            ))}
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setShowSaveModal(false)}>Cancelar</Button>
          <Button onClick={handleSaveCurrentConfig} disabled={saving}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "Guardando..." : "Guardar plantilla"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* ── Create/Edit template modal ────────────────────── */}
      <AppModal open={showEditModal} onOpenChange={setShowEditModal}>
        <AppModalHeader
          emoji={editEmoji}
          title={editingTemplate ? "Editar plantilla" : "Nueva plantilla"}
          description={editingTemplate ? editingTemplate.name : "Crea una configuración de tareas recurrentes"}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClose={() => setShowEditModal(false)}
        />
        <AppModalBody className="max-h-[60vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Nombre</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ej: Verano"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Descripción</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Icono</Label>
            <div className="flex gap-1.5 flex-wrap">
              {TEMPLATE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setEditEmoji(emoji)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all",
                    editEmoji === emoji
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-transparent hover:border-border"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tareas recurrentes</Label>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setEditItems((prev) => [...prev, emptyItemForm()])}
              >
                <Plus className="w-3 h-3 mr-1" /> Añadir tarea
              </Button>
            </div>
            <div className="space-y-3">
              {editItems.map((item, index) => (
                <div key={index} className="border rounded-xl p-3 space-y-2.5 bg-muted/30">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.title}
                        onChange={(e) => updateItemForm(index, { title: e.target.value })}
                        placeholder="Nombre de la tarea"
                        className="font-medium"
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => updateItemForm(index, { description: e.target.value })}
                        placeholder="Descripción (opcional)"
                        className="text-xs"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Days */}
                    <div className="flex gap-1">
                      {ALL_DAYS.map((day) => (
                        <button
                          key={day}
                          onClick={() => toggleItemDay(index, day)}
                          className={cn(
                            "w-7 h-7 rounded-md text-xs font-bold transition-all",
                            item.daysOfWeek.includes(day)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>

                    {/* Points */}
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-primary" />
                      <Input
                        type="number"
                        value={item.points}
                        onChange={(e) => updateItemForm(index, { points: e.target.value })}
                        className="w-16 h-7 text-xs text-center"
                        min="0"
                      />
                    </div>

                    {/* Penalty */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Penalización:</span>
                      <Input
                        type="number"
                        value={item.penaltyPoints}
                        onChange={(e) => updateItemForm(index, { penaltyPoints: e.target.value })}
                        className="w-16 h-7 text-xs text-center"
                        placeholder="="
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Default state */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Estado por defecto:</span>
                    <button
                      onClick={() =>
                        updateItemForm(index, {
                          defaultState: item.defaultState === "pending" ? "completed" : "pending",
                        })
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-md font-medium transition-all",
                        item.defaultState === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      )}
                    >
                      {item.defaultState === "pending" ? "Pendiente" : "Completada"}
                    </button>
                  </div>
                </div>
              ))}
              {editItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Añade tareas a esta plantilla
                </p>
              )}
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button onClick={handleSaveTemplate} disabled={editSaving}>
            <Check className="w-4 h-4 mr-1.5" />
            {editSaving ? "Guardando..." : editingTemplate ? "Guardar cambios" : "Crear plantilla"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* ── Apply modal ───────────────────────────────────── */}
      <AppModal open={!!applyingTemplate} onOpenChange={() => setApplyingTemplate(null)}>
        <AppModalHeader
          emoji={applyingTemplate?.emoji}
          title="Aplicar plantilla"
          description={applyingTemplate?.name}
          color="bg-gradient-to-br from-orange-500 to-red-500"
          onClose={() => setApplyingTemplate(null)}
        />
        <AppModalBody>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">Atención</p>
            <p>
              Al aplicar esta plantilla se <strong>desactivarán todas las tareas recurrentes actuales</strong> y
              se crearán las {applyingTemplate?.items.length} tareas de la plantilla.
            </p>
            <p className="mt-1 text-amber-600">
              Las tareas puntuales y las recompensas no se verán afectadas.
            </p>
          </div>

          <div>
            <Label className="mb-2 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Asignar tareas a
            </Label>
            <div className="flex gap-2 flex-wrap">
              {members.map((u) => (
                <button
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all",
                    selectedMembers.includes(u.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-transparent text-muted-foreground"
                  )}
                >
                  <span>{u.avatar}</span>
                  {u.name}
                </button>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay miembros en la familia</p>
              )}
            </div>
          </div>

          {/* Preview items */}
          <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground mb-1.5">Tareas que se activarán:</p>
            {applyingTemplate?.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span>• {item.title}</span>
                <span className="font-mono">{formatDays(item.recurringPattern.daysOfWeek)}</span>
              </div>
            ))}
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setApplyingTemplate(null)}>Cancelar</Button>
          <Button
            onClick={handleApply}
            disabled={selectedMembers.length === 0 || applying}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Play className="w-4 h-4 mr-1.5" />
            {applying ? "Aplicando..." : "Aplicar plantilla"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* ── Delete confirmation ───────────────────────────── */}
      <AppModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AppModalHeader
          emoji="🗑️"
          title="Eliminar plantilla"
          description={deleteTarget?.name}
          color="bg-gradient-to-br from-red-500 to-red-700"
          onClose={() => setDeleteTarget(null)}
        />
        <AppModalBody>
          <p className="text-sm">
            ¿Estás seguro de que quieres eliminar la plantilla <strong>{deleteTarget?.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <p className="text-xs text-muted-foreground">
            Las tareas que ya hayas aplicado no se verán afectadas.
          </p>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
