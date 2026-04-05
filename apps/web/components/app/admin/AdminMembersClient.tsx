"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_TASK_INSTANCES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Star, Plus, Minus, SlidersHorizontal, Pencil, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";

const AVATARS = ["👦", "👧", "👨", "👩", "👴", "👵", "🧑", "👱", "🧒", "🐶", "🐱", "🦊"];

type DialogMode = "adjust" | "edit" | "add" | null;

export default function AdminMembersClient() {
  const t = useTranslations("admin.members");
  const { users, adjustPoints } = useAppStore();

  const [mode, setMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Adjust points form
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // Edit / Add member form
  const [formName, setFormName] = useState("");
  const [formAvatar, setFormAvatar] = useState("👦");
  const [formRole, setFormRole] = useState<"admin" | "member">("member");

  const today = new Date().toISOString().split("T")[0];

  const getTasksToday = (userId: string) =>
    MOCK_TASK_INSTANCES.filter((ti) => ti.userId === userId && ti.date === today).length;

  const getCompletedToday = (userId: string) =>
    MOCK_TASK_INSTANCES.filter(
      (ti) => ti.userId === userId && ti.date === today && ti.state === "completed"
    ).length;

  const openAdjust = (user: User) => {
    setSelectedUser(user);
    setAdjustAmount("");
    setAdjustReason("");
    setMode("adjust");
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormAvatar(user.avatar);
    setFormRole(user.role);
    setMode("edit");
  };

  const openAdd = () => {
    setSelectedUser(null);
    setFormName("");
    setFormAvatar("👦");
    setFormRole("member");
    setMode("add");
  };

  const closeDialog = () => {
    setMode(null);
    setSelectedUser(null);
  };

  const handleAdjust = () => {
    if (!selectedUser) return;
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error("Introduce un número válido (positivo o negativo)");
      return;
    }
    adjustPoints(selectedUser.id, amount);
    toast.success(`${amount > 0 ? "+" : ""}${amount} pts a ${selectedUser.name}`, {
      description: adjustReason || "Ajuste manual",
    });
    closeDialog();
  };

  const handleSaveMember = () => {
    if (!formName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (mode === "add") {
      toast.success(`Miembro "${formName}" añadido`, {
        description: "En la versión real se guardaría en la base de datos.",
      });
    } else {
      toast.success(`Perfil de "${formName}" actualizado`);
    }
    closeDialog();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <Button size="sm" onClick={openAdd}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          {t("addMember")}
        </Button>
      </div>

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
                        <span className="font-bold text-primary">
                          {user.pointsBalance.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width:
                                totalToday > 0
                                  ? `${(doneToday / totalToday) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {doneToday}/{totalToday}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => openAdjust(user)}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                          {t("adjustPoints")}
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
        <AppModalHeader
          emoji="⭐"
          title={t("adjustPointsTitle", { name: selectedUser?.name ?? "" })}
          description="Añade o resta puntos manualmente"
          color="bg-gradient-to-br from-primary to-orange-400"
          onClose={closeDialog}
        />
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
          <Button onClick={handleAdjust}>Aplicar</Button>
        </AppModalFooter>
      </AppModal>

      {/* Add / Edit member modal */}
      <AppModal open={mode === "add" || mode === "edit"} onOpenChange={closeDialog}>
        <AppModalHeader
          emoji={mode === "add" ? "👤" : selectedUser?.avatar}
          title={mode === "add" ? "Añadir miembro" : `Editar a ${selectedUser?.name}`}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          onClose={closeDialog}
        />
        <AppModalBody>
          <div>
            <Label>Nombre</Label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="Nombre del miembro" className="mt-1.5" />
          </div>
          <div>
            <Label className="mb-2 block">Avatar</Label>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((av) => (
                <button key={av} onClick={() => setFormAvatar(av)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
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
          <Button onClick={handleSaveMember}>{mode === "add" ? "Añadir" : "Guardar"}</Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
