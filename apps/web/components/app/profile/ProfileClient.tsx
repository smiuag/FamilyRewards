"use client";

import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_POINTS_HISTORY } from "@/lib/mock-data";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ProfileClient() {
  const t = useTranslations("profile");
  const { currentUser } = useAppStore();

  if (!currentUser) return null;

  const history = MOCK_POINTS_HISTORY.filter((h) => h.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const completedThisMonth = 12; // mock value

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
          value="7"
          suffix={t("days")}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label={t("bestStreak")}
          value="14"
          suffix={t("days")}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label={t("completedThisMonth")}
          value={String(completedThisMonth)}
          suffix="tareas"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("historyDate")}</TableHead>
                  <TableHead>{t("historyReason")}</TableHead>
                  <TableHead className="text-right">{t("historyAmount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.date), "d MMM", { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {entry.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-bold text-sm",
                          entry.amount > 0 ? "text-green-600" : "text-red-500"
                        )}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount}
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
  icon,
  label,
  value,
  suffix,
  bg,
  className,
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
