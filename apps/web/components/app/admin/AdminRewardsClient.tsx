"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  fetchFamilyRewards,
  fetchFamilyClaims,
  createReward,
  updateReward,
  approveClaim,
  rejectClaim,
} from "@/lib/api/rewards";
import {
  REWARDS_CATALOG,
  REWARD_CATEGORIES,
  type RewardCategory,
  type CatalogReward,
} from "@/lib/catalog/rewards-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  Plus, Star, CheckCircle2, XCircle, Clock, Pencil, Search, Check, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/types";

// ─── Catalog config ────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  easy:   { label: "Fácil",   color: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  medium: { label: "Normal",  color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  hard:   { label: "Difícil", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  epic:   { label: "Épico",   color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
};
const MAX_POINTS = 20000;

// ─── Edit form ─────────────────────────────────────────────────────────────────
const emptyForm = () => ({ title: "", description: "", emoji: "🎁", pointsCost: "100" });

type AddStep = "tabs" | "confirm";
type AddTab  = "catalog" | "custom";

export default function AdminRewardsClient() {
  const {
    rewards: storeRewards, users, claims, currentUser,
    updateClaim: storeUpdateClaim, loadRewards, loadClaims,
    updateReward: storeUpdateReward,
  } = useAppStore();

  const [filterMember, setFilterMember] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  // ── Edit existing reward ────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Add reward modal ────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<AddTab>("catalog");
  const [addStep, setAddStep] = useState<AddStep>("tabs");

  // catalog tab state
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RewardCategory | "all">("all");
  const [pointRange, setPointRange] = useState<[number, number]>([0, MAX_POINTS]);
  const [showFilters, setShowFilters] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [confirmReward, setConfirmReward] = useState<CatalogReward | null>(null);
  const [confirmPoints, setConfirmPoints] = useState("");

  // custom tab state
  const [customForm, setCustomForm] = useState({ emoji: "🎁", title: "", description: "", points: "100" });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchFamilyRewards(), fetchFamilyClaims()])
      .then(([rewards, claims]) => { loadRewards(rewards); loadClaims(claims); })
      .catch(() => toast.error("Error al cargar recompensas"))
      .finally(() => setLoadingData(false));
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getReward = (id: string) => storeRewards.find((r) => r.id === id);
  const getUser   = (id: string) => users.find((u) => u.id === id);

  const pendingClaims = claims.filter(
    (c) => c.status === "pending" && (filterMember === "all" || c.userId === filterMember)
  );

  const categoryLabel =
    activeCategory === "all"
      ? `🌟 Todas (${REWARDS_CATALOG.length})`
      : `${REWARD_CATEGORIES[activeCategory as RewardCategory]?.emoji} ${REWARD_CATEGORIES[activeCategory as RewardCategory]?.label}`;

  const filteredCatalog = useMemo(() => REWARDS_CATALOG.filter((r) => {
    const matchSearch   = r.title.toLowerCase().includes(search.toLowerCase()) ||
                          r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || r.category === activeCategory;
    const matchPoints   = r.suggestedPoints >= pointRange[0] && r.suggestedPoints <= pointRange[1];
    return matchSearch && matchCategory && matchPoints;
  }), [search, activeCategory, pointRange]);

  const categories = Object.entries(REWARD_CATEGORIES) as [RewardCategory, typeof REWARD_CATEGORIES[RewardCategory]][];

  // ── Claims ───────────────────────────────────────────────────────────────────
  const handleApprove = async (claimId: string) => {
    const claim  = claims.find((c) => c.id === claimId);
    if (!claim) return;
    const reward = getReward(claim.rewardId);
    const user   = users.find((u) => u.id === claim.userId);
    if (!reward || !user) return;
    storeUpdateClaim(claimId, "approved");
    try {
      await approveClaim(claimId, claim.userId, reward.pointsCost, user.pointsBalance, reward.title, reward.emoji);
      toast.success("Solicitud aprobada");
    } catch {
      storeUpdateClaim(claimId, "pending");
      toast.error("Error al aprobar la solicitud");
    }
  };

  const handleReject = async (claimId: string) => {
    storeUpdateClaim(claimId, "rejected");
    try {
      await rejectClaim(claimId);
      toast.success("Solicitud rechazada");
    } catch {
      storeUpdateClaim(claimId, "pending");
      toast.error("Error al rechazar la solicitud");
    }
  };

  // ── Edit existing ────────────────────────────────────────────────────────────
  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setEditForm({
      title: reward.title, description: reward.description ?? "",
      emoji: reward.emoji, pointsCost: String(reward.pointsCost),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editingReward) return;
    setSavingEdit(true);
    const cost = parseInt(editForm.pointsCost) || 100;
    try {
      await updateReward(editingReward.id, {
        title: editForm.title, description: editForm.description, emoji: editForm.emoji, pointsCost: cost,
      });
      storeUpdateReward(editingReward.id, {
        title: editForm.title, description: editForm.description, emoji: editForm.emoji, pointsCost: cost,
      });
      toast.success(`"${editForm.title}" actualizada`);
      setEditOpen(false);
    } catch {
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Add modal ────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setAddTab("catalog"); setAddStep("tabs");
    setSearch(""); setActiveCategory("all"); setPointRange([0, MAX_POINTS]);
    setShowFilters(false); setConfirmReward(null);
    setCustomForm({ emoji: "🎁", title: "", description: "", points: "100" });
    setAddOpen(true);
  };

  const closeAdd = () => { setAddOpen(false); setAddStep("tabs"); setConfirmReward(null); };

  const openConfirmCatalog = (reward: CatalogReward) => {
    setConfirmReward(reward);
    setConfirmPoints(String(reward.suggestedPoints));
    setAddStep("confirm");
  };

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
      setAddStep("tabs");
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
      closeAdd();
    } catch {
      toast.error("Error al crear la recompensa. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Recompensas</h1>
        <div className="flex items-center gap-2">
          <Select value={filterMember} onValueChange={(v) => setFilterMember(v ?? "all")}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <span className="text-sm truncate">
                {filterMember === "all"
                  ? "Todos los miembros"
                  : (() => { const u = users.find((u) => u.id === filterMember); return u ? `${u.avatar} ${u.name}` : "Todos"; })()}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los miembros</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.avatar} {u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Añadir recompensa
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending claims */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Solicitudes pendientes
                {pendingClaims.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">{pendingClaims.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={pendingClaims.length === 0 ? "pb-5" : "p-0"}>
              {pendingClaims.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No hay solicitudes pendientes 🎉</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recompensa</TableHead>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Coste</TableHead>
                      <TableHead>Solicitada</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingClaims.map((claim) => {
                      const reward = getReward(claim.rewardId);
                      const user   = getUser(claim.userId);
                      return (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{reward?.emoji}</span>
                              <span className="font-medium">{reward?.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{user?.avatar}</span>
                              <span className="font-medium">{user?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                              <span className="font-bold text-primary">{reward?.pointsCost.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(claim.requestedAt), "d MMM, HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" className="h-8 bg-green-500 hover:bg-green-600 text-white text-xs"
                                onClick={() => handleApprove(claim.id)}>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprobar
                              </Button>
                              <Button size="sm" variant="outline"
                                className="h-8 text-red-500 border-red-200 hover:bg-red-50 text-xs"
                                onClick={() => handleReject(claim.id)}>
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Current rewards */}
          <div>
            <h2 className="text-base font-semibold mb-3">Recompensas de la familia</h2>
            {storeRewards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">🎁</p>
                <p className="font-medium">Sin recompensas</p>
                <p className="text-sm mt-1">
                  Pulsa <strong>Añadir recompensa</strong> para elegir del catálogo o crear una personalizada
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {storeRewards.map((reward) => (
                  <Card key={reward.id} className="shadow-sm">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{reward.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{reward.title}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-xs font-bold text-primary">{reward.pointsCost.toLocaleString()} pts</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(reward)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Edit reward modal ─────────────────────────────────────────────── */}
      <AppModal open={editOpen} onOpenChange={setEditOpen}>
        <AppModalHeader
          emoji={editForm.emoji || "🎁"}
          title={`Editar: ${editingReward?.title}`}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={() => setEditOpen(false)}
        />
        <AppModalBody>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-1">
              <Label>Emoji</Label>
              <Input value={editForm.emoji} onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                className="text-center text-xl mt-1.5" />
            </div>
            <div className="col-span-4">
              <Label>Nombre</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Nombre de la recompensa" className="mt-1.5" autoFocus />
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Breve descripción" className="mt-1.5" />
          </div>
          <div>
            <Label>Coste en puntos</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
              <Input type="number" value={editForm.pointsCost}
                onChange={(e) => setEditForm({ ...editForm, pointsCost: e.target.value })} className="font-bold text-primary" />
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} disabled={savingEdit || !editForm.title.trim()}>
            {savingEdit ? "Guardando..." : "Guardar cambios"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* ── Add reward modal (wide) ───────────────────────────────────────── */}
      <AppModal open={addOpen} onOpenChange={closeAdd} className="sm:max-w-3xl">
        {addStep === "tabs" ? (
          <>
            <AppModalHeader
              emoji="🎁"
              title="Añadir recompensa"
              description="Elige del catálogo o crea una personalizada"
              color="bg-gradient-to-br from-violet-500 to-purple-600"
              onClose={closeAdd}
            />
            <AppModalBody className="space-y-4">
              {/* Tab toggle */}
              <div className="flex gap-1 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setAddTab("catalog")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                    addTab === "catalog" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  🌟 Del catálogo
                </button>
                <button
                  onClick={() => setAddTab("custom")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                    addTab === "custom" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ✏️ Personalizada
                </button>
              </div>

              {/* ── Catalog tab ── */}
              {addTab === "catalog" && (
                <div className="space-y-3">
                  {/* Search + category + filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar recompensas..." value={search}
                        onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={activeCategory} onValueChange={(v) => setActiveCategory((v ?? "all") as RewardCategory | "all")}>
                      <SelectTrigger className="w-44">
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
                    <div className="p-3 bg-muted/50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rango de puntos</span>
                        <span className="text-sm text-muted-foreground">
                          {pointRange[0].toLocaleString()} – {pointRange[1].toLocaleString()} pts
                        </span>
                      </div>
                      <Slider min={0} max={MAX_POINTS} step={100} value={pointRange}
                        onValueChange={(v) => setPointRange(v as [number, number])} className="w-full" />
                      <div className="flex gap-2 flex-wrap">
                        {([
                          { label: "≤ 300",    range: [0, 300] },
                          { label: "300–1000", range: [300, 1000] },
                          { label: "1000–5000",range: [1000, 5000] },
                          { label: "+5000",    range: [5000, MAX_POINTS] },
                        ] as { label: string; range: [number, number] }[]).map((p) => (
                          <Button key={p.label} size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => setPointRange(p.range)}>
                            {p.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {filteredCatalog.length} recompensa{filteredCatalog.length !== 1 ? "s" : ""} encontrada{filteredCatalog.length !== 1 ? "s" : ""}
                  </p>

                  {/* Catalog grid — scrollable */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {filteredCatalog.map((reward) => {
                      const isAdded = addedIds.has(reward.id);
                      const tier    = TIER_CONFIG[reward.tier];
                      const catConf = REWARD_CATEGORIES[reward.category];
                      return (
                        <button
                          key={reward.id}
                          disabled={isAdded}
                          onClick={() => !isAdded && openConfirmCatalog(reward)}
                          className={cn(
                            "text-left rounded-xl border-2 p-3 transition-all hover:shadow-sm",
                            isAdded
                              ? "border-green-300 bg-green-50/60 cursor-default"
                              : "border-transparent bg-muted/40 hover:border-primary/40 hover:bg-muted/60"
                          )}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <span className="text-2xl">{reward.emoji}</span>
                            {isAdded && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          </div>
                          <p className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{reward.title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              <span className="text-xs font-bold text-primary">{reward.suggestedPoints.toLocaleString()}</span>
                            </div>
                            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", tier.color)}>
                              {catConf.emoji}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {filteredCatalog.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-muted-foreground">
                        <p className="text-2xl mb-2">🔍</p>
                        <p className="text-sm">Sin resultados</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Custom tab ── */}
              {addTab === "custom" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-1">
                      <Label>Emoji</Label>
                      <Input value={customForm.emoji} maxLength={2}
                        onChange={(e) => setCustomForm({ ...customForm, emoji: e.target.value })}
                        className="text-center text-xl mt-1.5" />
                    </div>
                    <div className="col-span-4">
                      <Label>Nombre</Label>
                      <Input value={customForm.title} placeholder="Nombre de la recompensa"
                        onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                        className="mt-1.5" autoFocus />
                    </div>
                  </div>
                  <div>
                    <Label>Descripción (opcional)</Label>
                    <Input value={customForm.description} placeholder="Breve descripción"
                      onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                      className="mt-1.5" />
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
                </div>
              )}
            </AppModalBody>

            <AppModalFooter>
              <Button variant="outline" onClick={closeAdd}>Cancelar</Button>
              {addTab === "custom" && (
                <Button onClick={handleSaveCustom} disabled={saving || !customForm.title.trim()}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {saving ? "Creando..." : "Crear recompensa"}
                </Button>
              )}
              {addTab === "catalog" && (
                <span className="text-xs text-muted-foreground self-center">
                  Pulsa una recompensa del catálogo para añadirla
                </span>
              )}
            </AppModalFooter>
          </>
        ) : (
          /* ── Confirm catalog step ── */
          <>
            <AppModalHeader
              emoji={confirmReward?.emoji}
              title="Confirmar recompensa"
              description={confirmReward?.title}
              color="bg-gradient-to-br from-blue-500 to-indigo-600"
              onClose={closeAdd}
            />
            <AppModalBody>
              <p className="text-sm text-muted-foreground">{confirmReward?.description}</p>
              <div>
                <Label>Puntos para tu familia</Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Star className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
                  <Input type="number" value={confirmPoints}
                    onChange={(e) => setConfirmPoints(e.target.value)}
                    className="font-bold text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Sugerido: {confirmReward?.suggestedPoints.toLocaleString()} pts
                </p>
              </div>
            </AppModalBody>
            <AppModalFooter>
              <Button variant="outline" onClick={() => { setAddStep("tabs"); setConfirmReward(null); }}>
                Volver
              </Button>
              <Button onClick={handleConfirmCatalog} disabled={saving}>
                <Plus className="w-4 h-4 mr-1.5" />
                {saving ? "Añadiendo..." : "Añadir recompensa"}
              </Button>
            </AppModalFooter>
          </>
        )}
      </AppModal>
    </div>
  );
}
