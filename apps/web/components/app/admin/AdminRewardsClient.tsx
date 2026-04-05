"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Star, CheckCircle2, XCircle, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reward } from "@/lib/types";

type DialogMode = "add" | "edit" | null;

const emptyForm = () => ({
  title: "",
  description: "",
  emoji: "🎁",
  pointsCost: "100",
});

export default function AdminRewardsClient() {
  const { rewards: storeRewards, users, claims, updateClaim, addReward, updateReward } = useAppStore();
  const [filterMember, setFilterMember] = useState<string>("all");
  const [mode, setMode] = useState<DialogMode>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [form, setForm] = useState(emptyForm());



  const getReward = (id: string) => storeRewards.find((r) => r.id === id);
  const getUser = (id: string) => users.find((u) => u.id === id);

  const pendingClaims = claims.filter(
    (c) => c.status === "pending" && (filterMember === "all" || c.userId === filterMember)
  );

  const handleApprove = (claimId: string) => {
    updateClaim(claimId, "approved");
    toast.success("Solicitud aprobada");
  };

  const handleReject = (claimId: string) => {
    updateClaim(claimId, "rejected");
    toast.error("Solicitud rechazada");
  };

  const openAdd = () => {
    setEditingReward(null);
    setForm(emptyForm());
    setMode("add");
  };

  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setForm({
      title: reward.title,
      description: reward.description ?? "",
      emoji: reward.emoji,
      pointsCost: String(reward.pointsCost),
    });
    setMode("edit");
  };

  const closeDialog = () => {
    setMode(null);
    setEditingReward(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const cost = parseInt(form.pointsCost) || 100;

    if (mode === "edit" && editingReward) {
      updateReward(editingReward.id, { title: form.title, description: form.description, emoji: form.emoji, pointsCost: cost });
      toast.success(`Recompensa "${form.title}" actualizada`);
    } else {
      addReward({ title: form.title, description: form.description, emoji: form.emoji, pointsCost: cost, status: "available" });
      toast.success(`Recompensa "${form.title}" creada`);
    }
    closeDialog();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">Gestión de Recompensas</h1>
        <div className="flex items-center gap-2">
          <Select value={filterMember} onValueChange={(v) => setFilterMember(v ?? "all")}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Todos" />
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
            Nueva recompensa
          </Button>
        </div>
      </div>

      {/* Pending claims */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Solicitudes pendientes
            {pendingClaims.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0">
                {pendingClaims.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={pendingClaims.length === 0 ? "pb-5" : "p-0"}>
          {pendingClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No hay solicitudes pendientes 🎉
            </p>
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
                  const user = getUser(claim.userId);
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
                          <span className="font-bold text-primary">
                            {reward?.pointsCost.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(claim.requestedAt), "d MMM, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="h-8 bg-green-500 hover:bg-green-600 text-white text-xs"
                            onClick={() => handleApprove(claim.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-500 border-red-200 hover:bg-red-50 text-xs"
                            onClick={() => handleReject(claim.id)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Rechazar
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

      {/* Rewards catalog */}
      <div>
        <h2 className="text-base font-semibold mb-3">Catálogo de recompensas</h2>
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
                      <span className="text-xs font-bold text-primary">
                        {reward.pointsCost.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => openEdit(reward)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add / Edit reward modal */}
      <AppModal open={mode !== null} onOpenChange={closeDialog}>
        <AppModalHeader
          emoji={form.emoji || "🎁"}
          title={mode === "add" ? "Nueva recompensa" : `Editar: ${editingReward?.title}`}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={closeDialog}
        />
        <AppModalBody>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-1">
              <Label>Emoji</Label>
              <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="text-center text-xl mt-1.5" />
            </div>
            <div className="col-span-4">
              <Label>Nombre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nombre de la recompensa" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Descripción (opcional)</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descripción" className="mt-1.5" />
          </div>
          <div>
            <Label>Coste en puntos</Label>
            <Input type="number" value={form.pointsCost}
              onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} className="mt-1.5" />
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button onClick={handleSave}>{mode === "add" ? "Crear recompensa" : "Guardar cambios"}</Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
