"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchUserTransactions } from "@/lib/api/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Flame, Trophy, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ProfileClient() {
  const t = useTranslations("profile");
  const { currentUser, transactions, taskInstances, loadTransactions } = useAppStore();

  useEffect(() => {
    if (!currentUser) return;
    fetchUserTransactions(currentUser.id)
      .then((txs) => {
        loadTransactions([
          ...useAppStore.getState().transactions.filter((t) => t.userId !== currentUser.id),
          ...txs,
        ]);
      })
      .catch(() => {});
  }, [currentUser?.id]);

  if (!currentUser) return null;

  // Points history (last 50 for this user, newest first)
  const history = transactions
    .filter((tx) => tx.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);

  // Completed tasks this month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const completedThisMonth = taskInstances.filter(
    (ti) =>
      ti.userId === currentUser.id &&
      ti.state === "completed" &&
      isWithinInterval(new Date(ti.date + "T12:00:00"), { start: monthStart, end: monthEnd })
  ).length;

  // Current streak: consecutive days (ending today) where user completed all their tasks
  const today = format(now, "yyyy-MM-dd");
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = format(d, "yyyy-MM-dd");
    if (dateStr > today) continue;
    const dayInstances = taskInstances.filter(
      (ti) => ti.userId === currentUser.id && ti.date === dateStr
    );
    if (dayInstances.length === 0) break;
    if (dayInstances.every((ti) => ti.state === "completed")) streak++;
    else break;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>

      {/* Profile card */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary to-orange-400" />
        <CardContent className="pt-0">
          <div className="-mt-8 flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-5xl">
              {currentUser.avatar}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-extrabold">{currentUser.name}</h2>
              <Badge variant={currentUser.role === "admin" ? "default" : "secondary"}>
                {currentUser.role === "admin" ? "Administrador" : "Miembro"}
              </Badge>
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-primary/10">
            <Star className="w-6 h-6 text-primary fill-primary" />
            <div>
              <p className="text-3xl font-extrabold text-primary">
                {currentUser.pointsBalance.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{t("totalPoints")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label={t("streak")}
          value={String(streak)}
          suffix={t("days")}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label={t("completedThisMonth")}
          value={String(completedThisMonth)}
          suffix="tareas"
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label="Total transacciones"
          value={String(history.length)}
          suffix="movimientos"
          bg="bg-green-50"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Points history */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t("pointsHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Sin historial todavía.
            </p>
          ) : (
            <Table aria-label="Historial de puntos">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("historyDate")}</TableHead>
                  <TableHead>{t("historyReason")}</TableHead>
                  <TableHead className="text-right">{t("historyAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(tx.createdAt), "d MMM", { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <span className="mr-1.5">{tx.emoji}</span>
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn("font-bold text-sm", tx.amount > 0 ? "text-green-600" : "text-red-500")}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon, label, value, suffix, bg, className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
  bg: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="pt-5">
        <div className={`inline-flex p-2 rounded-xl ${bg} mb-2`}>{icon}</div>
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-extrabold">{value}</p>
          <p className="text-sm text-muted-foreground">{suffix}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
