"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  addManagedProfile,
  updateProfile,
  adjustProfilePoints,
  deleteProfile,
  fetchFamilyProfiles,
  setVacationMode,
} from "@/lib/api/members";
import { createInviteAction } from "@/lib/actions/invite";
import { deleteAuthUserAction } from "@/lib/actions/delete-auth-user";
import { deleteFamilyAction } from "@/lib/actions/delete-family";
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
import { Star, Plus, Minus, SlidersHorizontal, Pencil, UserPlus, Mail, Copy, Check, Trash2, Palmtree, Shield, ShieldOff, LogOut } from "lucide-react";
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

type DialogMode = "adjust" | "edit" | "add" | "invite" | "delete" | "vacation" | "role" | "unsubscribe" | null;

export default function AdminMembersClient() {
  const t = useTranslations("admin.members");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const {
    users, currentUser, taskInstances, familyName,
    updateMember, adjustPoints,
  } = useAppStore();

  useEffect(() => {
    fetchFamilyProfiles()
      .then((profiles) => useAppStore.setState({ users: profiles }))
      .catch(() => {});
  }, []);

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

  // Vacation form
  const [vacationDate, setVacationDate] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteProfileId, setInviteProfileId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteStep, setInviteStep] = useState<"choose" | "email" | "link">("choose");
  const [copied, setCopied] = useState(false);

  // Unsubscribe form
  const [unsubConfirmName, setUnsubConfirmName] = useState("");

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
  const openInvite = (user: User) => {
    setInviteEmail("");
    setInviteRole(user.role);
    setInviteProfileId(user.id);
    setInviteLink(null);
    setInviteStep("choose");
    setCopied(false);
    setSelectedUser(user);
    setMode("invite");
  };
  const openDelete = (user: User) => {
    setSelectedUser(user);
    setMode("delete");
  };
  const openVacation = (user: User) => {
    setSelectedUser(user);
    setVacationDate(user.vacationUntil ?? "");
    setMode("vacation");
  };
  const openRole = (user: User) => {
    setSelectedUser(user);
    setMode("role");
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

  const handleGenerateLink = async () => {
    if (!currentUser?.familyId || !currentUser?.id) return;
    setSaving(true);
    try {
      const result = await createInviteAction({
        familyId: currentUser.familyId,
        invitedByProfileId: currentUser.id,
        profileId: inviteProfileId!,
        role: inviteRole,
        origin: window.location.origin,
      });
      setInviteLink(result.link);
      setInviteStep("link");
      toast.success("Enlace generado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la invitación.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!inviteEmail.trim()) { toast.error("Introduce un email"); return; }
    if (!currentUser?.familyId || !currentUser?.id) return;
    setSaving(true);
    try {
      await createInviteAction({
        familyId: currentUser.familyId,
        invitedByProfileId: currentUser.id,
        profileId: inviteProfileId!,
        email: inviteEmail.trim(),
        role: inviteRole,
        origin: window.location.origin,
        sendEmail: true,
      });
      toast.success(`Invitación enviada a ${inviteEmail.trim()}`);
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la invitación.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const { authUserId } = await deleteProfile(selectedUser.id);
      // También borrar el auth user si existe
      if (authUserId) {
        await deleteAuthUserAction(authUserId).catch(() => {});
      }
      useAppStore.setState((prev) => ({
        users: prev.users.filter((u) => u.id !== selectedUser.id),
      }));
      toast.success(`"${selectedUser.name}" eliminado de la familia`);
      closeDialog();
    } catch {
      toast.error("Error al eliminar el miembro. Inténtalo de nuevo.");
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

  const handleVacation = async (until: string | null) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await setVacationMode(selectedUser.id, until);
      updateMember(selectedUser.id, { vacationUntil: until });
      toast.success(until
        ? t("vacationActivated", { name: selectedUser.name, date: until })
        : t("vacationDeactivated", { name: selectedUser.name })
      );
      closeDialog();
    } catch {
      toast.error(t("vacationError"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRole = async () => {
    if (!selectedUser) return;
    const newRole = selectedUser.role === "admin" ? "member" : "admin";

    // Validate: can't demote self if only admin
    if (newRole === "member" && selectedUser.id === currentUser?.id) {
      const adminCount = users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        toast.error("No puedes dejar de ser admin: eres el único administrador");
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile(selectedUser.id, { role: newRole });
      updateMember(selectedUser.id, { role: newRole });
      toast.success(newRole === "admin"
        ? `${selectedUser.name} ahora es administrador`
        : `${selectedUser.name} ahora es miembro`
      );
      closeDialog();
    } catch {
      toast.error("Error al cambiar el rol");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!unsubConfirmName.trim() || !currentUser?.familyId) return;
    setSaving(true);
    try {
      await deleteFamilyAction({
        familyId: currentUser.familyId,
        confirmName: unsubConfirmName,
      });

      const supabase = (await import("@/lib/supabase/client")).createClient();
      await supabase.auth.signOut();
      useAppStore.getState().logout();
      router.push(`/${locale}/login`);
      toast.success("Familia eliminada correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al dar de baja");
    } finally {
      setSaving(false);
    }
  };

  const adminsCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openAdd}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            {t("addMember")}
          </Button>
          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => { setUnsubConfirmName(""); setMode("unsubscribe"); }}>
            <LogOut className="w-4 h-4 mr-1.5" />
            Darse de baja
          </Button>
        </div>
      </div>

      {/* Members table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table aria-label="Miembros de la familia">
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
                      <button
                        onClick={() => router.push(`/${locale}/members/${user.id}`)}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                          {user.avatar}
                        </div>
                        <span className="font-semibold">{user.name}</span>
                        {user.vacationUntil && user.vacationUntil >= new Date().toISOString().split("T")[0] && (
                          <Badge className="bg-teal-100 text-teal-700 border-0 text-[10px] ml-1">{t("vacationBadge")}</Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => openRole(user)} className="hover:opacity-80 transition-opacity">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrador" : "Miembro"}
                        </Badge>
                      </button>
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
                        {!user.authUserId && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openInvite(user)}>
                            <Mail className="w-3 h-3 mr-1" /> Enviar invitación
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEdit(user)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openAdjust(user)}>
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> {t("adjustPoints")}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openVacation(user)}
                          title="Modo vacaciones">
                          <Palmtree className="w-3.5 h-3.5" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(user)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
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
                aria-label="Restar 10 puntos"
                onClick={() => setAdjustAmount((v) => String((parseInt(v) || 0) - 10))}>
                <Minus className="w-4 h-4" />
              </Button>
              <Input id="adjust-points" type="number" placeholder="ej: +50 o -100" value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)} className="text-center text-lg font-bold" />
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl"
                aria-label="Sumar 10 puntos"
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
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Nombre</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del miembro" className="mt-1.5" autoFocus />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as "admin" | "member")}>
                <SelectTrigger className="mt-1.5">
                  <span>{formRole === "member" ? "Miembro" : "Administrador"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Miembro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Avatar</Label>
            <div className="grid grid-cols-10 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {AVATARS.map((av) => (
                <button key={av} onClick={() => setFormAvatar(av)}
                  aria-label={`Avatar ${av}`}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    formAvatar === av ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  }`}>
                  {av}
                </button>
              ))}
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button onClick={handleSaveMember} disabled={saving || !formName.trim()}>
            {saving ? "Guardando..." : mode === "add" ? "Añadir" : "Guardar"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Invite modal */}
      <AppModal open={mode === "invite"} onOpenChange={closeDialog}>
        <AppModalHeader emoji="✉️"
          title={selectedUser ? `Invitar a ${selectedUser.name}` : "Enviar invitación"}
          description="El invitado podrá registrarse con contraseña o Google"
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClose={closeDialog} />
        <AppModalBody>
          {inviteStep === "choose" && (
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={() => setInviteStep("email")}>
                <Mail className="w-5 h-5" />
                <span className="font-semibold">Enviar por email</span>
                <span className="text-xs text-muted-foreground">Se abrirá tu cliente de correo</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-1" onClick={handleGenerateLink} disabled={saving}>
                <Copy className="w-5 h-5" />
                <span className="font-semibold">{saving ? "Generando..." : "Generar enlace"}</span>
                <span className="text-xs text-muted-foreground">Para compartir por WhatsApp, etc.</span>
              </Button>
            </div>
          )}

          {inviteStep === "email" && (
            <>
              <div>
                <Label>Email del invitado</Label>
                <Input type="email" placeholder="nombre@email.com" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)} className="mt-1.5" autoFocus />
              </div>
            </>
          )}

          {inviteStep === "link" && inviteLink && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Comparte este enlace. Expira en 7 días.
              </p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-xl min-w-0">
                <span className="text-xs text-muted-foreground flex-1 break-all line-clamp-2">{inviteLink}</span>
                <Button size="sm" variant="outline" className="h-8 flex-shrink-0" onClick={handleCopyLink}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </AppModalBody>
        <AppModalFooter>
          {inviteStep === "choose" && (
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          )}
          {inviteStep === "email" && (
            <>
              <Button variant="outline" onClick={() => setInviteStep("choose")}>Atrás</Button>
              <Button onClick={handleSendEmail} disabled={saving || !inviteEmail.trim()}>
                <Mail className="w-4 h-4 mr-1.5" />
                {saving ? "Enviando..." : "Enviar"}
              </Button>
            </>
          )}
          {inviteStep === "link" && (
            <Button variant="outline" onClick={closeDialog}>Cerrar</Button>
          )}
        </AppModalFooter>
      </AppModal>

      {/* Delete member confirmation modal */}
      <AppModal open={mode === "delete"} onOpenChange={closeDialog}>
        <AppModalHeader emoji="⚠️"
          title={`Eliminar a ${selectedUser?.name ?? ""}`}
          description="Esta accion no se puede deshacer"
          color="bg-gradient-to-br from-red-500 to-red-600"
          onClose={closeDialog} />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            Se eliminara a <strong>{selectedUser?.name}</strong> de la familia, junto con todo su historial de tareas y puntos.
          </p>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            {saving ? "Eliminando..." : "Eliminar"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Vacation mode modal */}
      <AppModal open={mode === "vacation"} onOpenChange={closeDialog}>
        <AppModalHeader emoji="🏖️"
          title={t("vacationTitle", { name: selectedUser?.name ?? "" })}
          description={t("vacationDescription")}
          color="bg-gradient-to-br from-teal-500 to-cyan-600"
          onClose={closeDialog} />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">
            {t("vacationExplainer")}
          </p>
          {selectedUser?.vacationUntil && selectedUser.vacationUntil >= new Date().toISOString().split("T")[0] ? (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-800">
              <p className="font-semibold">{t("vacationActive")}</p>
              <p>{t("vacationUntil", { date: selectedUser.vacationUntil })}</p>
            </div>
          ) : null}
          <div>
            <Label className="mb-1.5 block">{t("vacationDateLabel")}</Label>
            <Input
              type="date"
              value={vacationDate}
              onChange={(e) => setVacationDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </AppModalBody>
        <AppModalFooter>
          {selectedUser?.vacationUntil && (
            <Button variant="outline" onClick={() => handleVacation(null)} disabled={saving}>
              {t("vacationDeactivate")}
            </Button>
          )}
          <Button variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
          <Button onClick={() => handleVacation(vacationDate || null)} disabled={saving || !vacationDate}>
            <Palmtree className="w-4 h-4 mr-1.5" />
            {saving ? t("vacationSaving") : t("vacationActivate")}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Role change modal */}
      <AppModal open={mode === "role"} onOpenChange={closeDialog}>
        <AppModalHeader
          emoji={selectedUser?.role === "admin" ? "👤" : "🛡️"}
          title={selectedUser?.role === "admin" ? "Quitar admin" : "Hacer administrador"}
          description={selectedUser?.name}
          color={selectedUser?.role === "admin"
            ? "bg-gradient-to-br from-amber-500 to-orange-600"
            : "bg-gradient-to-br from-blue-500 to-indigo-600"}
          onClose={closeDialog} />
        <AppModalBody>
          {selectedUser?.role === "admin" ? (
            <>
              <p className="text-sm text-muted-foreground">
                <strong>{selectedUser.name}</strong> dejará de ser administrador y pasará a ser miembro.
              </p>
              {selectedUser.id === currentUser?.id && adminsCount <= 1 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  No puedes dejar de ser admin: eres el único administrador de la familia.
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <strong>{selectedUser?.name}</strong> se convertirá en administrador y podrá gestionar tareas, recompensas y miembros.
            </p>
          )}
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button
            onClick={handleToggleRole}
            disabled={saving || (selectedUser?.role === "admin" && selectedUser?.id === currentUser?.id && adminsCount <= 1)}
          >
            {selectedUser?.role === "admin" ? (
              <><ShieldOff className="w-4 h-4 mr-1.5" />{saving ? "Cambiando..." : "Quitar admin"}</>
            ) : (
              <><Shield className="w-4 h-4 mr-1.5" />{saving ? "Cambiando..." : "Hacer admin"}</>
            )}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Unsubscribe / delete family modal */}
      <AppModal open={mode === "unsubscribe"} onOpenChange={closeDialog}>
        <AppModalHeader emoji="🚨"
          title="Darse de baja"
          description="Esta acción eliminará toda la familia y sus datos"
          color="bg-gradient-to-br from-red-500 to-red-700"
          onClose={closeDialog} />
        <AppModalBody>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 space-y-1">
            <p className="font-semibold">Se eliminará permanentemente:</p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              <li>Todos los miembros y sus perfiles</li>
              <li>Todas las tareas e historial</li>
              <li>Todas las recompensas y reclamaciones</li>
              <li>Las cuentas de usuario asociadas</li>
            </ul>
          </div>
          <div>
            <Label>Escribe <strong>{familyName}</strong> para confirmar</Label>
            <Input
              value={unsubConfirmName}
              onChange={(e) => setUnsubConfirmName(e.target.value)}
              placeholder={familyName}
              className="mt-1.5"
              autoFocus
            />
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
          <Button variant="destructive" onClick={handleUnsubscribe}
            disabled={saving || unsubConfirmName.trim().toLowerCase() !== (familyName || "").trim().toLowerCase()}>
            {saving ? "Eliminando..." : "Eliminar familia"}
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
