"use client";

import { useState, useMemo, useEffect } from "react";
import {
  REWARDS_CATALOG,
  REWARD_CATEGORIES,
  type RewardCategory,
  type CatalogReward,
} from "@/lib/catalog/rewards-catalog";
import { useAppStore } from "@/lib/store/useAppStore";
import { createReward } from "@/lib/api/rewards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Search, Plus, Check, Star, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { TIER_CONFIG, MAX_REWARD_POINTS as MAX_POINTS } from "@/lib/config/constants";

export default function CatalogRewardsClient() {
  const { setupVisited, markSetupVisited, currentUser } = useAppStore();
  useEffect(() => { markSetupVisited("catalogRewards"); }, []);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RewardCategory | "all">("all");
  const [pointRange, setPointRange] = useState<[number, number]>([0, MAX_POINTS]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [confirmReward, setConfirmReward] = useState<CatalogReward | null>(null);
  const [confirmPoints, setConfirmPoints] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryLabel =
    activeCategory === "all"
      ? `🌟 Todas (${REWARDS_CATALOG.length})`
      : `${REWARD_CATEGORIES[activeCategory as RewardCategory]?.emoji} ${REWARD_CATEGORIES[activeCategory as RewardCategory]?.label}`;

  // Custom reward creation
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ emoji: "🎁", title: "", description: "", points: "100" });

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

  const openConfirm = (reward: CatalogReward) => {
    setConfirmReward(reward);
    setConfirmPoints(String(reward.suggestedPoints));
  };

  const saveReward = async (data: { title: string; description?: string; emoji: string; pointsCost: number }) => {
    if (!currentUser?.familyId) throw new Error("No family");
    const newReward = await createReward(currentUser.familyId, { ...data, status: "available" });
    useAppStore.setState((prev) => ({ rewards: [...prev.rewards, newReward] }));
    return newReward;
  };

  const handleCustomSave = async () => {
    if (!customForm.title.trim()) return;
    setSaving(true);
    try {
      await saveReward({
        title: customForm.title,
        description: customForm.description,
        emoji: customForm.emoji,
        pointsCost: parseInt(customForm.points) || 100,
      });
      toast.success(`"${customForm.title}" añadida al catálogo`);
      setCustomOpen(false);
      setCustomForm({ emoji: "🎁", title: "", description: "", points: "100" });
    } catch {
      toast.error("Error al crear la recompensa. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!confirmReward) return;
    const points = parseInt(confirmPoints) || confirmReward.suggestedPoints;
    setSaving(true);
    try {
      await saveReward({
        title: confirmReward.title,
        description: confirmReward.description,
        emoji: confirmReward.emoji,
        pointsCost: points,
      });
      setAddedIds((prev) => new Set([...prev, confirmReward.id]));
      toast.success(`"${confirmReward.title}" añadida al catálogo familiar`, {
        description: `${points.toLocaleString()} puntos`,
      });
      setConfirmReward(null);
    } catch {
      toast.error("Error al añadir la recompensa. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
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

      {!setupVisited.catalogRewards && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 space-y-1">
          <p className="font-semibold text-orange-800 text-sm">🎁 Añade recompensas a tu familia</p>
          <p className="text-sm text-orange-700">
            Elige las recompensas que podrán canjear los miembros con sus puntos. Puedes ajustar
            el coste de cada una o crear una personalizada.
          </p>
        </div>
      )}

      {/* Actions row */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setCustomOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Crear personalizada
        </Button>
      </div>

      {/* Search + category + filter */}
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
        <Select value={activeCategory} onValueChange={(v) => setActiveCategory((v ?? "all") as RewardCategory | "all")}>
          <SelectTrigger className="w-48">
            <span className="text-sm truncate">{categoryLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌟 Todas ({REWARDS_CATALOG.length})</SelectItem>
            {categories.map(([key, cat]) => {
              const count = REWARDS_CATALOG.filter((r) => r.category === key).length;
              return (
                <SelectItem key={key} value={key}>
                  {cat.emoji} {cat.label} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && "border-primary text-primary")}
        >
          <Filter className="w-4 h-4" />
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
                <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-1">{reward.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-1">
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
                  onClick={() => !isAdded && openConfirm(reward)}
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

      {/* Custom reward modal */}
      <AppModal open={customOpen} onOpenChange={setCustomOpen}>
        <AppModalHeader
          emoji={customForm.emoji || "🎁"}
          title="Crear recompensa personalizada"
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          onClose={() => setCustomOpen(false)}
        />
        <AppModalBody>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-1">
              <Label>Emoji</Label>
              <Input value={customForm.emoji}
                onChange={(e) => setCustomForm({ ...customForm, emoji: e.target.value })}
                className="text-center text-xl mt-1.5" maxLength={2} />
            </div>
            <div className="col-span-4">
              <Label>Nombre</Label>
              <Input value={customForm.title}
                onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                placeholder="Nombre de la recompensa" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input value={customForm.description}
              onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
              placeholder="Breve descripción" className="mt-1.5" />
          </div>
          <div>
            <Label>Puntos</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
              <Input type="number" value={customForm.points}
                onChange={(e) => setCustomForm({ ...customForm, points: e.target.value })}
                className="font-bold text-primary" />
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setCustomOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleCustomSave} disabled={saving || !customForm.title.trim()}>
            <Plus className="w-4 h-4 mr-1.5" />
            {saving ? "Creando..." : "Crear recompensa"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Confirm add modal */}
      <AppModal open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <AppModalHeader
          emoji={confirmReward?.emoji}
          title="Añadir al catálogo"
          description={confirmReward?.title}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={() => setConfirmReward(null)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            {confirmReward?.description}
          </p>
          <div>
            <Label>Puntos para tu familia</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
              <Input
                type="number"
                value={confirmPoints}
                onChange={(e) => setConfirmPoints(e.target.value)}
                className="font-bold text-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Sugerido: {confirmReward?.suggestedPoints.toLocaleString()} pts
            </p>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setConfirmReward(null)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleConfirmAdd} disabled={saving}>
            <Plus className="w-4 h-4 mr-1.5" />
            {saving ? "Añadiendo..." : "Añadir al catálogo"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
