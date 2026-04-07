"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useMultipliersStore } from "@/lib/store/useMultipliersStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PointMultiplier } from "@/lib/multipliers";

const todayStr = new Date().toISOString().split("T")[0];
const addDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().split("T")[0];

export default function AdminMultipliersClient() {
  const { currentUser, users, tasks } = useAppStore();
  const { multipliers, addMultiplier, toggleActive, deleteMultiplier } =
    useMultipliersStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    multiplier: "2",
    emoji: "⚡",
    startDate: todayStr,
    endDate: addDays(7),
    taskIds: "all" as "all" | string[],
    userIds: "all" as "all" | string[],
  });

  if (!currentUser || currentUser.role !== "admin") return null;

  const handleCreate = () => {
    if (!form.name) return;
    const m: PointMultiplier = {
      id: `mp${Date.now()}`,
      name: form.name,
      description: form.description,
      multiplier: parseFloat(form.multiplier) || 2,
      emoji: form.emoji,
      taskIds: form.taskIds,
      userIds: form.userIds,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: true,
      createdBy: currentUser.id,
    };
    addMultiplier(m);
    setOpen(false);
    setForm({
      name: "",
      description: "",
      multiplier: "2",
      emoji: "⚡",
      startDate: todayStr,
      endDate: addDays(7),
      taskIds: "all",
      userIds: "all",
    });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Multiplicadores de Puntos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Eventos especiales que multiplican los puntos ganados
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo multiplicador
        </Button>
      </div>

      <div className="grid gap-4">
        {multipliers.map((m) => {
          const isNowActive =
            m.isActive && m.startDate <= today && m.endDate >= today;
          return (
            <Card key={m.id} className={cn("shadow-sm", !m.isActive && "opacity-60")}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl",
                        isNowActive ? "bg-primary/10" : "bg-muted"
                      )}
                    >
                      {m.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{m.name}</p>
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            isNowActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          ×{m.multiplier}
                        </span>
                        {isNowActive && (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                            Activo ahora
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>
                          📅 {m.startDate} → {m.endDate}
                        </span>
                        <span>
                          👤{" "}
                          {m.userIds === "all"
                            ? "Todos"
                            : (m.userIds as string[])
                                .map(
                                  (id) =>
                                    users.find((u) => u.id === id)?.name
                                )
                                .join(", ")}
                        </span>
                        <span>
                          📋{" "}
                          {m.taskIds === "all"
                            ? "Todas las tareas"
                            : (m.taskIds as string[])
                                .map(
                                  (id) =>
                                    tasks.find((t) => t.id === id)?.title
                                )
                                .join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={m.isActive}
                        onCheckedChange={() => toggleActive(m.id)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {m.isActive ? "Activo" : "Desactivado"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => deleteMultiplier(m.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo multiplicador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-1">
                <Label>Emoji</Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="text-center text-xl"
                />
              </div>
              <div className="col-span-4">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Fin de semana productivo"
                />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Breve explicación"
              />
            </div>
            <div>
              <Label>Multiplicador (×)</Label>
              <Input
                type="number"
                min="1.5"
                max="10"
                step="0.5"
                value={form.multiplier}
                onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} className="flex-1">
                Crear multiplicador
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
