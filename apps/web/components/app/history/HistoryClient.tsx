"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { PointsTransaction } from "@/lib/types";

const TYPE_CONFIG = {
  task:       { label: "Tarea",       color: "bg-green-100 text-green-700" },
  reward:     { label: "Recompensa",  color: "bg-orange-100 text-orange-700" },
  adjustment: { label: "Ajuste",      color: "bg-blue-100 text-blue-700" },
  streak:     { label: "Racha",       color: "bg-red-100 text-red-700" },
};

function groupByDate(txs: PointsTransaction[]): [string, PointsTransaction[]][] {
  const map = new Map<string, PointsTransaction[]>();
  for (const tx of txs) {
    const day = tx.createdAt.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(tx);
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

function getMonthOptions() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: format(d, "MMMM yyyy", { locale: es }),
      date: d,
    });
  }
  return months;
}

export default function HistoryClient() {
  const { currentUser, users, transactions } = useAppStore();
  const isAdmin = currentUser?.role === "admin";

  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id ?? "");
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const viewUser = users.find((u) => u.id === selectedUserId) ?? currentUser;

  const filtered = useMemo(() => {
    const monthDate = new Date(selectedMonth + "-01");
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return transactions
      .filter((tx) => {
        const inRange = isWithinInterval(new Date(tx.createdAt), { start, end });
        const forUser = tx.userId === selectedUserId;
        return inRange && forUser;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [transactions, selectedUserId, selectedMonth]);

  const grouped = groupByDate(filtered);

  const totalEarned = filtered.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const totalSpent = filtered.filter((tx) => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Historial de puntos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro detallado de todas las transacciones
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <Star className="w-4 h-4 fill-primary" />
          <span className="font-bold text-lg">{viewUser?.pointsBalance.toLocaleString()}</span>
          <span className="text-sm font-medium">saldo actual</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {isAdmin && (
          <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v ?? currentUser?.id ?? "")}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.avatar} {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={selectedMonth} onValueChange={(v) => setSelectedMonth(v ?? monthOptions[0].value)}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <span className="capitalize">{m.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month summary */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Ganados</span>
              </div>
              <p className="text-2xl font-extrabold text-green-600">
                +{totalEarned.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">pts</span>
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Gastados</span>
              </div>
              <p className="text-2xl font-extrabold text-orange-500">
                {totalSpent.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">pts</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction groups */}
      {grouped.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-14 text-center text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin movimientos este mes</p>
            <p className="text-sm mt-1">Las transacciones aparecerán aquí cuando se completen tareas o se canjeen recompensas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              {/* Date header */}
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {format(new Date(date + "T12:00:00"), "EEEE, d MMMM", { locale: es })}
              </p>
              <div className="space-y-2">
                {txs.map((tx) => {
                  const typeConfig = TYPE_CONFIG[tx.type];
                  return (
                    <Card key={tx.id} className="shadow-sm">
                      <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                          {/* Emoji */}
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0",
                            tx.amount > 0 ? "bg-green-100" : "bg-orange-100"
                          )}>
                            {tx.emoji}
                          </div>

                          {/* Description */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tx.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge className={cn("text-[10px] px-1.5 py-0 border-0", typeConfig.color)}>
                                {typeConfig.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(tx.createdAt), "HH:mm")}
                              </span>
                            </div>
                          </div>

                          {/* Amount + balance */}
                          <div className="text-right flex-shrink-0">
                            <p className={cn(
                              "font-bold text-sm",
                              tx.amount > 0 ? "text-green-600" : "text-orange-500"
                            )}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} pts
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-end gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-muted-foreground" />
                              {tx.balanceAfter.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
