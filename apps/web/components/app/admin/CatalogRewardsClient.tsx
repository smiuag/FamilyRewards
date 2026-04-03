"use client";

import { useState, useMemo } from "react";
import {
  REWARDS_CATALOG,
  REWARD_CATEGORIES,
  type RewardCategory,
  type CatalogReward,
} from "@/lib/catalog/rewards-catalog";
import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_REWARDS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Search, Plus, Check, Star, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/types";

const TIER_CONFIG = {
  easy:   { label: "Fácil",    color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  medium: { label: "Normal",   color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  hard:   { label: "Difícil",  color: "bg-orange-100 text-orange-700",dot: "bg-orange-500" },
  epic:   { label: "Épico",    color: "bg-purple-100 text-purple-700",dot: "bg-purple-500" },
};

const MAX_POINTS = 20000;

export default function CatalogRewardsClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RewardCategory | "all">("all");
  const [pointRange, setPointRange] = useState<[number, number]>([0, MAX_POINTS]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return REWARDS_CATALOG.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === "all" || r.category === activeCategory;
      const matchPoints = r.suggestedPoints >= pointRange[0] && r.suggestedPoints <= pointRange[1];
      return matchSearch && matchCategory && matchPoints;
    });
  }, [search, activeCategory, pointRange]);

  const handleAdd = (reward: CatalogReward) => {
    // In a real app this would call an API
    setAddedIds((prev) => new Set([...prev, reward.id]));
    toast.success(`"${reward.title}" añadida al catálogo familiar`, {
      description: `${reward.suggestedPoints} puntos`,
    });
  };

  const categories = Object.entries(REWARD_CATEGORIES) as [RewardCategory, typeof REWARD_CATEGORIES[RewardCategory]][];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold">Catálogo de Recompensas</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Selecciona recompensas del catálogo para añadirlas a tu familia
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recompensas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && "border-primary text-primary")}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          Filtros
        </Button>
      </div>

      {/* Point range filter */}
      {showFilters && (
        <Card className="p-4">
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rango de puntos</span>
              <span className="text-sm text-muted-foreground">
                {pointRange[0].toLocaleString()} – {pointRange[1].toLocaleString()} pts
              </span>
            </div>
            <Slider
              min={0}
              max={MAX_POINTS}
              step={100}
              value={pointRange}
              onValueChange={(v) => setPointRange(v as [number, number])}
              className="w-full"
            />
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "≤ 300 pts",   range: [0, 300] as [number, number] },
                { label: "300–1000 pts", range: [300, 1000] as [number, number] },
                { label: "1000–5000 pts",range: [1000, 5000] as [number, number] },
                { label: "+ 5000 pts",   range: [5000, MAX_POINTS] as [number, number] },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setPointRange(preset.range)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            🌟 Todas ({REWARDS_CATALOG.length})
          </button>
          {categories.map(([key, cat]) => {
            const count = REWARDS_CATALOG.filter((r) => r.category === key).length;
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

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} recompensa{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((reward) => {
          const isAdded = addedIds.has(reward.id);
          const tier = TIER_CONFIG[reward.tier];
          const catConfig = REWARD_CATEGORIES[reward.category];
          return (
            <Card
              key={reward.id}
              className={cn(
                "shadow-sm hover:shadow-md transition-all border-2",
                isAdded ? "border-green-300 bg-green-50/50" : "border-transparent"
              )}
            >
              <CardContent className="pt-4 pb-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-4xl">{reward.emoji}</span>
                  <Badge className={cn("text-xs border-0", catConfig.color)}>
                    {catConfig.emoji} {catConfig.label}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm leading-tight mb-1">{reward.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {reward.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="font-bold text-primary text-sm">
                      {reward.suggestedPoints.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", tier.dot)} />
                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", tier.color)}>
                      {tier.label}
                    </span>
                  </div>
                </div>

                {/* Add button */}
                <Button
                  size="sm"
                  className={cn("w-full mt-3 h-8 text-xs", isAdded && "bg-green-500 hover:bg-green-600")}
                  onClick={() => !isAdded && handleAdd(reward)}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Añadida
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Añadir al catálogo
                    </>
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
    </div>
  );
}
