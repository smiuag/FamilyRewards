"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useChallengesStore } from "@/lib/store/useChallengesStore";
import { MOCK_USERS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FamilyChallenge, ChallengeGoalType } from "@/lib/challenges";

const addDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().split("T")[0];
const todayStr = new Date().toISOString().split("T")[0];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  upcoming: "bg-amber-100 text-amber-700",
};

const GOAL_LABELS: Record<ChallengeGoalType, string> = {
  collective_points: "Puntos colectivos",
  completion_count: "Tareas completadas",
  streak_all: "Racha de todos",
};

export default function AdminChallengesClient() {
  const { currentUser } = useAppStore();
  const { challenges, addChallenge, updateStatus, deleteChallenge } =
    useChallengesStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    emoji: "🏆",
    goalType: "collective_points" as ChallengeGoalType,
    goalTarget: "500",
    rewardDescription: "",
    rewardEmoji: "🎉",
    rewardPoints: "50",
    startDate: todayStr,
    endDate: addDays(7),
  });

  if (!currentUser || currentUser.role !== "admin") return null;

  const handleCreate = () => {
    if (!form.title || !form.rewardDescription) return;
    const newChallenge: FamilyChallenge = {
      id: `ch${Date.now()}`,
      title: form.title,
      description: form.description,
      emoji: form.emoji,
      goalType: form.goalType,
      goalTarget: parseInt(form.goalTarget) || 100,
      currentProgress: 0,
      contributions: [],
      rewardDescription: form.rewardDescription,
      rewardEmoji: form.rewardEmoji,
      rewardPoints: parseInt(form.rewardPoints) || 50,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "active",
      createdBy: currentUser.id,
    };
    addChallenge(newChallenge);
    setOpen(false);
    setForm({
      title: "",
      description: "",
      emoji: "🏆",
      goalType: "collective_points",
      goalTarget: "500",
      rewardDescription: "",
      rewardEmoji: "🎉",
      rewardPoints: "50",
      startDate: todayStr,
      endDate: addDays(7),
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Retos Familiares
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {challenges.filter((c) => c.status === "active").length} activo(s)
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo reto
        </Button>
      </div>

      <div className="grid gap-4">
        {challenges.map((c) => {
          const pct = Math.min(100, (c.currentProgress / c.goalTarget) * 100);
          return (
            <Card key={c.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.emoji}</span>
                    <div>
                      <CardTitle className="text-base">{c.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        STATUS_COLORS[c.status]
                      )}
                    >
                      {c.status === "active"
                        ? "Activo"
                        : c.status === "completed"
                        ? "Completado"
                        : c.status === "failed"
                        ? "Fallido"
                        : "Próximo"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{GOAL_LABELS[c.goalType]}</span>
                    <span>
                      {c.currentProgress} / {c.goalTarget} (
                      {Math.round(pct)}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                {/* Contributions */}
                <div className="flex flex-wrap gap-2">
                  {c.contributions.map((con) => {
                    const user = MOCK_USERS.find((u) => u.id === con.userId);
                    return (
                      <span
                        key={con.userId}
                        className="text-xs bg-muted px-2 py-1 rounded-lg"
                      >
                        {user?.avatar} {user?.name}: {con.amount}
                      </span>
                    );
                  })}
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-sm">
                    {c.rewardEmoji} {c.rewardDescription}{" "}
                    <span className="text-muted-foreground">
                      (+{c.rewardPoints} pts)
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Hasta {c.endDate}
                    </span>
                    {c.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => updateStatus(c.id, "completed")}
                        >
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => updateStatus(c.id, "failed")}
                        >
                          <XCircle className="w-3 h-3 text-red-500" />
                          Fallar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => deleteChallenge(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New challenge dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo reto familiar</DialogTitle>
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
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nombre del reto"
                />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="¿En qué consiste el reto?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de objetivo</Label>
                <Select
                  value={form.goalType}
                  onValueChange={(v) =>
                    setForm({ ...form, goalType: v as ChallengeGoalType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collective_points">Puntos colectivos</SelectItem>
                    <SelectItem value="completion_count">Tareas completadas</SelectItem>
                    <SelectItem value="streak_all">Racha de todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meta</Label>
                <Input
                  type="number"
                  value={form.goalTarget}
                  onChange={(e) => setForm({ ...form, goalTarget: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
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
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-1">
                <Label>Emoji</Label>
                <Input
                  value={form.rewardEmoji}
                  onChange={(e) =>
                    setForm({ ...form, rewardEmoji: e.target.value })
                  }
                  className="text-center text-xl"
                />
              </div>
              <div className="col-span-4">
                <Label>Recompensa</Label>
                <Input
                  value={form.rewardDescription}
                  onChange={(e) =>
                    setForm({ ...form, rewardDescription: e.target.value })
                  }
                  placeholder="¿Qué gana la familia?"
                />
              </div>
            </div>
            <div>
              <Label>Puntos bonus por miembro</Label>
              <Input
                type="number"
                value={form.rewardPoints}
                onChange={(e) => setForm({ ...form, rewardPoints: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} className="flex-1">
                Crear reto
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
