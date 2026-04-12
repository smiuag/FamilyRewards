"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { Search, Plus, Check, Star, Filter, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { TIER_CONFIG, MAX_REWARD_POINTS as MAX_POINTS } from "@/lib/config/constants";

type Tab = "catalog" | "custom";

export default function AddRewardClient() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const { currentUser } = useAppStore();

  const [tab, setTab] = useState<Tab>("catalog");

  // catalog state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RewardCategory | "all">("all");
  const [pointRange, setPointRange] = useState<[number, number]>([0, MAX_POINTS]);
  const [showFilters, setShowFilters] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [confirmReward, setConfirmReward] = useState<CatalogReward | null>(null);
  const [confirmPoints, setConfirmPoints] = useState("");

  // custom state
  const [customForm, setCustomForm] = useState({ emoji: "🎁", title: "", description: "", points: "100" });

  const [saving, setSaving] = useState(false);

  const categoryLabel =
    activeCategory === "all"
      ? `🌟 Todas (${REWARDS_CATALOG.length})`
      : `${REWARD_CATEGORIES[activeCategory as RewardCategory]?.emoji} ${REWARD_CATEGORIES[activeCategory as RewardCategory]?.label}`;

  const filtered = useMemo(() => REWARDS_CATALOG.filter((r) => {
    const matchSearch   = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || r.category === activeCategory;
    const matchPoints   = r.suggestedPoints >= pointRange[0] && r.suggestedPoints <= pointRange[1];
    return matchSearch && matchCategory && matchPoints;
  }), [search, activeCategory, pointRange]);

  const categories = Object.entries(REWARD_CATEGORIES) as [RewardCategory, typeof REWARD_CATEGORIES[RewardCategory]][];

  const saveReward = async (data: { title: string; description?: string; emoji: string; pointsCost: number }) => {
    if (!currentUser?.familyId) throw new Error("No family");
    const newReward = await createReward(currentUser.familyId, { ...data, status: "available" });
    useAppStore.setState((prev) => ({ rewards: [...prev.rewards, newReward] }));
    return newReward;
  };

  const handleConfirmCatalog = async () => {
    if (!confirmReward) return;
    const points = parseInt(confirmPoints) || confirmReward.suggestedPoints;
    setSaving(true);
    try {
      await saveReward({ title: confirmReward.title, description: confirmReward.description, emoji: confirmReward.emoji, pointsCost: points });
      setAddedIds((prev) => new Set([...prev, confirmReward.id]));
      toast.success(`"${confirmReward.title}" añadida`, { description: `${points.toLocaleString()} puntos` });
      setConfirmReward(null);
    } catch {
      toast.error("Error al añadir la recompensa. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustom = async () => {
    if (!customForm.title.trim()) return;
    setSaving(true);
    try {
      await saveReward({
        title: customForm.title, description: customForm.description,
        emoji: customForm.emoji, pointsCost: parseInt(customForm.points) || 100,
      });
      toast.success(`"${customForm.title}" creada`);
      router.push(`/${locale}/admin/rewards`);
    } catch {
      toast.error("Error al crear la recompensa. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Recompensas</h1>
        <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/admin/rewards`)}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Recompensas
        </Button>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button onClick={() => setTab("catalog")}
          className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-all",
            tab === "catalog" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
          🌟 Del catálogo
        </button>
        <button onClick={() => setTab("custom")}
          className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-all",
            tab === "custom" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
          ✏️ Personalizada
        </button>
      </div>

      {/* ── Catalog tab ────────────────────────────────────────────────────────── */}
      {tab === "catalog" && (
        <div className="space-y-4">
          {/* Search + category + filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar recompensas..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={activeCategory} onValueChange={(v) => setActiveCategory((v ?? "all") as RewardCategory | "all")}>
              <SelectTrigger className="w-52">
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
            <Button variant="outline" size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "border-primary text-primary")}>
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
                <Slider min={0} max={MAX_POINTS} step={100} value={pointRange}
                  onValueChange={(v) => setPointRange(v as [number, number])} />
                <div className="flex gap-2 flex-wrap">
                  {([
                    { label: "≤ 300 pts",    range: [0, 300] },
                    { label: "300–1000 pts",  range: [300, 1000] },
                    { label: "1000–5000 pts", range: [1000, 5000] },
                    { label: "+ 5000 pts",    range: [5000, MAX_POINTS] },
                  ] as { label: string; range: [number, number] }[]).map((p) => (
                    <Button key={p.label} size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => setPointRange(p.range)}>
                      {p.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground">
            {filtered.length} recompensa{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((reward) => {
              const isAdded = addedIds.has(reward.id);
              const tier    = TIER_CONFIG[reward.tier];
              const catConf = REWARD_CATEGORIES[reward.category];
              return (
                <Card key={reward.id}
                  className={cn("shadow-sm hover:shadow-md transition-all border-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary",
                    isAdded ? "border-green-300 bg-green-50/50 cursor-default" : "border-transparent hover:border-primary/30"
                  )}
                  tabIndex={isAdded ? -1 : 0}
                  role="button"
                  aria-disabled={isAdded}
                  onClick={() => { if (!isAdded) { setConfirmReward(reward); setConfirmPoints(String(reward.suggestedPoints)); } }}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isAdded) { e.preventDefault(); setConfirmReward(reward); setConfirmPoints(String(reward.suggestedPoints)); } }}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-4xl">{reward.emoji}</span>
                      <Badge className={cn("text-xs border-0", catConf.color)}>
                        {catConf.emoji} {catConf.label}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-1">{reward.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-1">
                      {reward.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-bold text-primary text-sm">{reward.suggestedPoints.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", tier.dot)} />
                        <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", tier.color)}>
                          {tier.label}
                        </span>
                      </div>
                    </div>
                    <div className={cn("mt-3 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors",
                      isAdded
                        ? "bg-green-500 text-white"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}>
                      {isAdded ? <><Check className="w-3.5 h-3.5 mr-1" /> Añadida</> : <><Plus className="w-3.5 h-3.5 mr-1" /> Añadir</>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3" aria-hidden="true">🔍</p>
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm">Prueba con otro término o categoría</p>
            </div>
          )}
        </div>
      )}

      {/* ── Custom tab ─────────────────────────────────────────────────────────── */}
      {tab === "custom" && (
        <div className="max-w-md space-y-4">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-1">
              <Label htmlFor="reward-emoji">Emoji</Label>
              <Input id="reward-emoji" value={customForm.emoji} maxLength={2}
                onChange={(e) => setCustomForm({ ...customForm, emoji: e.target.value })}
                className="text-center text-xl mt-1.5" />
            </div>
            <div className="col-span-4">
              <Label htmlFor="reward-title">Nombre</Label>
              <Input id="reward-title" value={customForm.title} placeholder="Nombre de la recompensa"
                onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                className="mt-1.5" autoFocus />
            </div>
          </div>
          <div>
            <Label htmlFor="reward-desc">Descripción (opcional)</Label>
            <Input id="reward-desc" value={customForm.description} placeholder="Breve descripción"
              onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
              className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="reward-points">Puntos</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" aria-hidden="true" />
              <Input id="reward-points" type="number" value={customForm.points}
                onChange={(e) => setCustomForm({ ...customForm, points: e.target.value })}
                className="font-bold text-primary" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push(`/${locale}/admin/rewards`)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustom} disabled={saving || !customForm.title.trim()}>
              <Plus className="w-4 h-4 mr-1.5" />
              {saving ? "Creando..." : "Crear recompensa"}
            </Button>
          </div>
        </div>
      )}

      {/* Confirm catalog item */}
      <AppModal open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <AppModalHeader
          emoji={confirmReward?.emoji}
          title={confirmReward?.title ?? ""}
          description={confirmReward?.description}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={() => setConfirmReward(null)}
        />
        <AppModalBody>
          <div>
            <Label htmlFor="reward-confirm-points">Puntos para tu familia</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" aria-hidden="true" />
              <Input id="reward-confirm-points" type="number" value={confirmPoints}
                onChange={(e) => setConfirmPoints(e.target.value)}
                className="font-bold text-primary" autoFocus />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Sugerido: {confirmReward?.suggestedPoints.toLocaleString()} pts
            </p>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setConfirmReward(null)}>Cancelar</Button>
          <Button onClick={handleConfirmCatalog} disabled={saving}>
            <Plus className="w-4 h-4 mr-1.5" />
            {saving ? "Añadiendo..." : "Añadir recompensa"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
