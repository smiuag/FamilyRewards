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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Plus, Minus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";

export default function AdminMembersClient() {
  const t = useTranslations("admin.members");
  const { users, adjustPoints } = useAppStore();
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const getTasksToday = (userId: string) =>
    MOCK_TASK_INSTANCES.filter((ti) => ti.userId === userId && ti.date === today).length;

  const getCompletedToday = (userId: string) =>
    MOCK_TASK_INSTANCES.filter(
      (ti) => ti.userId === userId && ti.date === today && ti.state === "completed"
    ).length;

  const handleAdjust = () => {
    if (!adjustingUser) return;
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error("Introduce un número válido (positivo o negativo)");
      return;
    }
    adjustPoints(adjustingUser.id, amount);
    toast.success(
      `${amount > 0 ? "+" : ""}${amount} pts a ${adjustingUser.name}`,
      { description: adjustReason || "Ajuste manual" }
    );
    setAdjustingUser(null);
    setAdjustAmount("");
    setAdjustReason("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
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
                              width: totalToday > 0 ? `${(doneToday / totalToday) * 100}%` : "0%",
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {doneToday}/{totalToday}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAdjustingUser(user)}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                        {t("adjustPoints")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust points dialog */}
      <Dialog open={!!adjustingUser} onOpenChange={() => setAdjustingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("adjustPointsTitle", { name: adjustingUser?.name ?? "" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t("pointsAmount")}</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() =>
                    setAdjustAmount((v) => String((parseInt(v) || 0) - 10))
                  }
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  placeholder="ej: +50 o -100"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="text-center"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={() =>
                    setAdjustAmount((v) => String((parseInt(v) || 0) + 10))
                  }
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label>{t("reason")}</Label>
              <Input
                placeholder="Bonus por semana perfecta..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
