"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  fetchFamilyRewards,
  fetchFamilyClaims,
  updateReward,
  deleteReward,
  approveClaim,
  rejectClaim,
} from "@/lib/api/rewards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Star, CheckCircle2, XCircle, Clock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reward } from "@/lib/types";

export default function AdminRewardsClient() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const {
    rewards: storeRewards, users, claims,
    updateClaim: storeUpdateClaim, loadRewards, loadClaims,
    updateReward: storeUpdateReward, deleteReward: storeDeleteReward,
  } = useAppStore();

  const [loadingData, setLoadingData] = useState(true);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteReward = async () => {
    if (!rewardToDelete) return;
    setDeleting(true);
    storeDeleteReward(rewardToDelete.id);
    try {
      await deleteReward(rewardToDelete.id);
      toast.success(`"${rewardToDelete.title}" eliminada`);
    } catch {
      toast.error("Error al eliminar la recompensa");
    } finally {
      setDeleting(false);
      setRewardToDelete(null);
    }
  };

  // ── Edit modal ────────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", emoji: "🎁", pointsCost: "100" });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    Promise.all([fetchFamilyRewards(), fetchFamilyClaims()])
      .then(([rewards, claims]) => { loadRewards(rewards); loadClaims(claims); })
      .catch(() => toast.error("Error al cargar recompensas"))
      .finally(() => setLoadingData(false));
  }, []);

  const getReward = (id: string) => storeRewards.find((r) => r.id === id);
  const getUser   = (id: string) => users.find((u) => u.id === id);

  const pendingClaims = claims.filter((c) => c.status === "pending");

  // ── Claims ────────────────────────────────────────────────────────────────────
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

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setEditForm({ title: reward.title, description: reward.description ?? "", emoji: reward.emoji, pointsCost: String(reward.pointsCost) });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editingReward) return;
    setSavingEdit(true);
    const cost = parseInt(editForm.pointsCost) || 100;
    try {
      await updateReward(editingReward.id, { title: editForm.title, description: editForm.description, emoji: editForm.emoji, pointsCost: cost });
      storeUpdateReward(editingReward.id, { title: editForm.title, description: editForm.description, emoji: editForm.emoji, pointsCost: cost });
      toast.success(`"${editForm.title}" actualizada`);
      setEditOpen(false);
    } catch {
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Recompensas</h1>
        <Button size="sm" onClick={() => router.push(`/${locale}/admin/rewards/add`)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Añadir recompensa
        </Button>
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
                <p className="text-sm mt-1">Pulsa <strong>Añadir recompensa</strong> para empezar</p>
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
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRewardToDelete(reward)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(reward)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      <AppModal open={!!rewardToDelete} onOpenChange={(v) => { if (!v) setRewardToDelete(null); }}>
        <AppModalHeader
          emoji="🗑️"
          title="Eliminar recompensa"
          color="bg-gradient-to-br from-red-500 to-rose-600"
          onClose={() => setRewardToDelete(null)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong className="text-foreground">{rewardToDelete?.emoji} {rewardToDelete?.title}</strong>?
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            La recompensa desaparecerá del catálogo pero se mantendrá en el historial de canjes y puntos anteriores.
          </p>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setRewardToDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDeleteReward} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Edit modal */}
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
    </div>
  );
}
