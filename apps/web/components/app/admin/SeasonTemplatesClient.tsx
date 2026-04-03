"use client";

import { useState } from "react";
import { SEASON_TEMPLATES } from "@/lib/catalog/season-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckSquare, Gift, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SeasonTemplatesClient() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApply = (templateId: string, title: string) => {
    setAppliedIds((prev) => new Set([...prev, templateId]));
    toast.success(`Pack "${title}" aplicado`, {
      description: "Las tareas y recompensas han sido añadidas a tu familia",
    });
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
              {/* Header */}
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl flex-shrink-0">{template.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-extrabold text-lg">{template.title}</h2>
                      {isApplied && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <Check className="w-3 h-3 mr-1" /> Aplicado
                        </Badge>
                      )}
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      className={cn("h-8 text-xs", isApplied && "bg-green-500 hover:bg-green-600")}
                      onClick={() => !isApplied && handleApply(template.id, template.title)}
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
                    {/* Tasks */}
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

                    {/* Rewards */}
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
    </div>
  );
}
