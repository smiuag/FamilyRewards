"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  addManagedProfile,
  updateProfile,
  adjustProfilePoints,
  createInvitation,
} from "@/lib/api/members";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Plus, Minus, SlidersHorizontal, Pencil, UserPlus, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";

const AVATARS = [
  // Personas
  "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "👱", "🧔", "🧓", "👴", "👵",
  // Roles y estilos
  "🧑‍🍳", "🧑‍💻", "🧑‍🎨", "🧑‍🚀", "🧑‍🔬", "🧑‍🏫", "🧑‍⚕️", "🧑‍🎤", "🧑‍🏋️", "🥷",
  "👸", "🤴", "🧙", "🦸", "🦹", "🧝", "🧜", "🧚", "🎅", "🤶",
  // Animales
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐙", "🦄", "🐺", "🦝", "🐧",
  "🦋", "🐢", "🦖", "🦕", "🐉",
  // Objetos y símbolos divertidos
  "🤖", "👾", "👻", "💩", "🎃", "⭐", "🔥", "🌈", "🎸", "⚽",
];

type DialogMode = "adjust" | "edit" | "add" | "invite" | null;

export default function AdminMembersClient() {
  const t = useTranslations("admin.members");
  const {
    users, currentUser, taskInstances,
    addMember, updateMember, adjustPoints,
    setupVisited, markSetupVisited,
  } = useAppStore();

  useEffect(() => { markSetupVisited("members"); }, []);

  const [mode, setMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Adjust points form
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // Edit / Add member form
  const [formName, setFormName] = useState("");
  const [formAvatar, setFormAvatar] = useState("👦");
  const [formRole, setFormRole] = useState<"admin" | "member">("member");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("admin");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const getTasksToday = (userId: string) =>
    taskInstances.filter((ti) => ti.userId === userId && ti.date === today).length;
  const getCompletedToday = (userId: string) =>
    taskInstances.filter((ti) => ti.userId === userId && ti.date === today && ti.state === "completed").length;

  const openAdjust = (user: User) => {
    setSelectedUser(user); setAdjustAmount(""); setAdjustReason(""); setMode("adjust");
  };
  const openEdit = (user: User) => {
    setSelectedUser(user); setFormName(user.name); setFormAvatar(user.avatar); setFormRole(user.role); setMode("edit");
  };
  const openAdd = () => {
    setSelectedUser(null); setFormName(""); setFormAvatar("👦"); setFormRole("member"); setMode("add");
  };
  const openInvite = () => {
    setInviteEmail(""); setInviteRole("admin"); setInviteLink(null); setCopied(false); setMode("invite");
  };
  const closeDialog = () => { setMode(null); setSelectedUser(null); setInviteLink(null); };

  const handleAdjust = async () => {
    if (!selectedUser) return;
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error("Introduce un número válido (positivo o negativo)");
      return;
    }
    setSaving(true);
    try {
      const newBalance = await adjustProfilePoints(
        selectedUser.id, selectedUser.pointsBalance, amount, adjustReason
      );
      // Actualizar store local
      adjustPoints(selectedUser.id, amount, adjustReason || "Ajuste manual");
      // Sync balance exacto desde Supabase
      updateMember(selectedUser.id, { pointsBalance: newBalance });
      toast.success(`${amount > 0 ? "+" : ""}${amount} pts a ${selectedUser.name}`, {
        description: adjustReason || "Ajuste manual",
      });
      closeDialog();
    } catch {
      toast.error("Error al ajustar puntos. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMember = async () => {
    if (!formName.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      if (mode === "add") {
        const familyId = currentUser?.familyId;
        if (!familyId) throw new Error("No family");
        const newUser = await addManagedProfile(familyId, {
          name: formName.trim(),
          avatar: formAvatar,
          role: formRole,
        });
        // Añadir directamente al store con el ID real de Supabase
        useAppStore.setState((prev) => ({
          users: [...prev.users, newUser],
        }));
        toast.success(`"${formName}" añadido a la familia`);
      } else if (mode === "edit" && selectedUser) {
        await updateProfile(selectedUser.id, {
          name: formName.trim(),
          avatar: formAvatar,
          role: formRole,
        });
        updateMember(selectedUser.id, { name: formName.trim(), avatar: formAvatar, role: formRole });
        toast.success(`Perfil de "${formName}" actualizado`);
      }
      closeDialog();
    } catch {
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Introduce un email"); return; }
    if (!currentUser?.familyId || !currentUser?.id) return;
    setSaving(true);
    try {
      const token = await createInvitation(
        currentUser.familyId, currentUser.id, inviteEmail.trim(), inviteRole
      );
      const link = `${window.location.origin}/${window.location.pathname.split("/")[1]}/join?token=${token}`;
      setInviteLink(link);
      toast.success("Invitación creada");
    } catch {
      toast.error("Error al crear la invitación. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Enlace copiado");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={openInvite}>
            <Mail className="w-4 h-4 mr-1.5" />
            Invitar administrador
          </Button>
          <Button size="sm" onClick={openAdd}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            {t("addMember")}
          </Button>
        </div>
      </div>

      {!setupVisited.members && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 space-y-1">
          <p className="font-semibold text-orange-800 text-sm">👥 Añade a tu familia</p>
          <p className="text-sm text-orange-700">
            Aquí puedes añadir a todos los miembros de tu familia y ajustar sus puntos.
            Para dar acceso de administrador a otro adulto, usa <strong>Invitar administrador</strong>.
          </p>
        </div>
      )}

      {/* Members table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("points")}</TableHead>
                <TableHead>{t("tasksToday")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const totalToday = getTasksToday(user.id);
                const doneToday = getCompletedToday(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                          {user.avatar}
                        </div>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Administrador" : "Miembro"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-bold text-primary">{user.pointsBalance.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full"
                            style={{ width: totalToday > 0 ? `${(doneToday / totalToday) * 100}%` : "0%" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{doneToday}/{totalToday}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(user)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openAdjust(user)}>
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> {t("adjustPoints")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust points modal */}
      <AppModal open={mode === "adjust"} onOpenChange={closeDialog}>
        <AppModalHeader emoji="⭐"
          title={t("adjustPointsTitle", { name: selectedUser?.name ?? "" })}
          description="Añade o resta puntos manualmente"
          color="bg-gradient-to-br from-primary to-orange-400"
          onClose={closeDialog} />
        <AppModalBody>
          <div>
            <Label>{t("pointsAmount")}</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl"
                onClick={() => setAdjustAmount((v) => String((parseInt(v) || 0) - 10))}>
                <Minus className="w-4 h-4" />
              </Button>
              <Input type="number" placeholder="ej: +50 o -100" value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)} className="text-center text-lg font-bold" />
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl"
                onClick={() => setAdjustAmount((v) => String((parseInt(v) || 0) + 10))}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>{t("reason")}</Label>
            <Input placeholder="Bonus por semana perfecta..." value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)} className="mt-1.5" />
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button onClick={handleAdjust} disabled={saving}>
            {saving ? "Guardando..." : "Aplicar"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Add / Edit member modal */}
      <AppModal open={mode === "add" || mode === "edit"} onOpenChange={closeDialog}>
        <AppModalHeader
          emoji={mode === "add" ? "👤" : selectedUser?.avatar}
          title={mode === "add" ? "Añadir miembro" : `Editar a ${selectedUser?.name}`}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          onClose={closeDialog} />
        <AppModalBody>
          <div>
            <Label>Nombre</Label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="Nombre del miembro" className="mt-1.5" autoFocus />
          </div>
          <div>
            <Label className="mb-2 block">Avatar</Label>
            <div className="grid grid-cols-10 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {AVATARS.map((av) => (
                <button key={av} onClick={() => setFormAvatar(av)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    formAvatar === av ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  }`}>
                  {av}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={formRole} onValueChange={(v) => setFormRole(v as "admin" | "member")}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Miembro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button onClick={handleSaveMember} disabled={saving || !formName.trim()}>
            {saving ? "Guardando..." : mode === "add" ? "Añadir" : "Guardar"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Invite admin modal */}
      <AppModal open={mode === "invite"} onOpenChange={closeDialog}>
        <AppModalHeader emoji="✉️"
          title="Invitar a la familia"
          description="Envía un enlace de acceso por email"
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={closeDialog} />
        <AppModalBody>
          {!inviteLink ? (
            <>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="nombre@email.com" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)} className="mt-1.5" autoFocus />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "member")}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="member">Miembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Comparte este enlace con <strong>{inviteEmail}</strong>. Expira en 7 días.
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                <span className="text-xs text-muted-foreground flex-1 truncate">{inviteLink}</span>
                <Button size="sm" variant="outline" className="h-8 flex-shrink-0" onClick={handleCopyLink}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>
            {inviteLink ? "Cerrar" : "Cancelar"}
          </Button>
          {!inviteLink && (
            <Button onClick={handleInvite} disabled={saving || !inviteEmail.trim()}>
              {saving ? "Creando..." : "Crear invitación"}
            </Button>
          )}
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
