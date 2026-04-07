"use client";

import { useState } from "react";
import { SEASON_TEMPLATES } from "@/lib/catalog/season-templates";
import type { SeasonTemplate } from "@/lib/catalog/season-templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { Star, CheckSquare, Gift, Check, ChevronDown, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SeasonTemplatesClient() {
  const { users, addTask, addReward } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Apply modal state
  const [applyTemplate, setApplyTemplate] = useState<SeasonTemplate | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const members = users.filter((u) => u.role === "member");

  const openApply = (template: SeasonTemplate) => {
    setApplyTemplate(template);
    setSelectedMembers(members.map((u) => u.id)); // all selected by default
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleConfirmApply = () => {
    if (!applyTemplate) return;
    if (selectedMembers.length === 0) {
      toast.error("Selecciona al menos un miembro");
      return;
    }
    const adminId = users.find((u) => u.role === "admin")?.id ?? "u1";

    applyTemplate.tasks.forEach((task) => {
      addTask({
        title: task.title,
        description: task.description,
        points: task.suggestedPoints,
        assignedTo: selectedMembers,
        createdBy: adminId,
        isRecurring: false,
        isActive: true,
      });
    });

    applyTemplate.rewards.forEach((reward) => {
      addReward({
        title: reward.title,
        description: reward.description ?? "",
        emoji: reward.emoji,
        pointsCost: reward.suggestedPoints,
        status: "available",
      });
    });

    setAppliedIds((prev) => new Set([...prev, applyTemplate.id]));
    toast.success(`Pack "${applyTemplate.title}" aplicado`, {
      description: `${applyTemplate.tasks.length} tareas y ${applyTemplate.rewards.length} recompensas añadidas`,
    });
    setApplyTemplate(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Plantillas de Temporada</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Packs de tareas y recompensas listos para cada época del año
        </p>
      </div>

      <div className="grid gap-4">
        {SEASON_TEMPLATES.map((template) => {
          const isExpanded = expandedId === template.id;
          const isApplied = appliedIds.has(template.id);

          return (
            <Card
              key={template.id}
              className={cn(
                "shadow-sm border-2 transition-all overflow-hidden",
                isApplied ? "border-green-300 bg-green-50/30" : "border-transparent",
                template.color
              )}
            >
              <CardContent className="pt-5 pb-4">
                <div
                  className="flex items-center gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : template.id)}
                >
                  <div className="text-5xl flex-shrink-0">{template.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-extrabold text-lg">{template.title}</h2>
                      {isApplied && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <Check className="w-3 h-3 mr-1" /> Aplicado
                        </Badge>
                      )}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform duration-200 ml-1",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {template.tasks.length} tareas
                      </span>
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {template.rewards.length} recompensas
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className={cn("h-8 text-xs", isApplied && "bg-green-500 hover:bg-green-600")}
                      onClick={() => !isApplied && openApply(template)}
                      disabled={isApplied}
                    >
                      {isApplied ? (
                        <><Check className="w-3.5 h-3.5 mr-1" /> Aplicado</>
                      ) : (
                        "Aplicar pack"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-black/10 grid sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                        Tareas incluidas
                      </h3>
                      <div className="space-y-1.5">
                        {template.tasks.map((task, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-white/60 rounded-lg px-2.5 py-1.5">
                            <span className="text-base">{task.emoji}</span>
                            <span className="flex-1 font-medium">{task.title}</span>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              <span className="text-xs font-bold text-primary">{task.suggestedPoints}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-purple-500" />
                        Recompensas incluidas
                      </h3>
                      <div className="space-y-1.5">
                        {template.rewards.map((reward, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-white/60 rounded-lg px-2.5 py-1.5">
                            <span className="text-base">{reward.emoji}</span>
                            <span className="flex-1 font-medium">{reward.title}</span>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              <span className="text-xs font-bold text-primary">{reward.suggestedPoints.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Apply modal — member assignment */}
      <AppModal open={!!applyTemplate} onOpenChange={() => setApplyTemplate(null)}>
        <AppModalHeader
          emoji={applyTemplate?.emoji}
          title="Aplicar pack"
          description={applyTemplate?.title}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClose={() => setApplyTemplate(null)}
        />
        <AppModalBody>
          <div>
            <Label className="mb-2 block flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Asignar tareas a
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Las recompensas del pack se añaden al catálogo familiar (disponibles para todos).
            </p>
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
          <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p><CheckSquare className="w-3 h-3 inline mr-1 text-blue-500" />{applyTemplate?.tasks.length} tareas se añadirán a los miembros seleccionados</p>
            <p><Gift className="w-3 h-3 inline mr-1 text-purple-500" />{applyTemplate?.rewards.length} recompensas se añadirán al catálogo familiar</p>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setApplyTemplate(null)}>Cancelar</Button>
          <Button onClick={handleConfirmApply} disabled={selectedMembers.length === 0}>
            <Check className="w-4 h-4 mr-1.5" />
            Aplicar pack
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
