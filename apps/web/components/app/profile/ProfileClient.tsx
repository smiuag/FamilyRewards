"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePinStore } from "@/lib/store/usePinStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
import { fetchUserTransactions } from "@/lib/api/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Flame, Trophy, CheckCircle2, Sun, Moon, Monitor, Globe, Lock, Trash2, Palette } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MAX_STREAK_LOOKBACK_DAYS } from "@/lib/config/constants";
import { toast } from "sonner";

export default function ProfileClient() {
  const t = useTranslations("profile");
  const tRoles = useTranslations("roles");
  const { currentUser, transactions, taskInstances, loadTransactions } = useAppStore();
  const { hasPin, setPin, removePin } = usePinStore();
  const { theme, setTheme } = useThemeStore();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const params = useParams();
  const locale = params?.locale as string ?? "es";
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

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

  const currentHasPin = hasPin(currentUser.id);

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
  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
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
                {tRoles(currentUser.role)}
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
          suffix={t("tasks")}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          label={t("totalTransactions")}
          value={String(history.length)}
          suffix={t("movements")}
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
              {t("noHistory")}
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

      {/* Preferences */}
      <h2 className="text-lg font-bold pt-2">{t("preferences")}</h2>

      {/* Theme */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            {t("appearance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setTheme(opt)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  theme === opt
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted hover:bg-muted/80"
                )}
              >
                {opt === "light" && <Sun className="w-5 h-5" />}
                {opt === "dark" && <Moon className="w-5 h-5" />}
                {opt === "system" && <Monitor className="w-5 h-5" />}
                <span className="text-xs font-medium">{t(`theme_${opt}`)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([
              { code: "es", flag: "\u{1F1EA}\u{1F1F8}", label: "Espa\u00f1ol" },
              { code: "en", flag: "\u{1F1EC}\u{1F1E7}", label: "English" },
            ] as const).map((lang) => (
              <button
                key={lang.code}
                onClick={() => intlRouter.replace(intlPathname, { locale: lang.code })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                  locale === lang.code
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted hover:bg-muted/80"
                )}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PIN */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {t("pinTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("pinDescription")}</p>
          {currentHasPin ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                {t("pinActive")}
              </span>
              <Button
                variant="outline" size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => { removePin(currentUser.id); toast.success(t("pinDeleted")); }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> {t("deletePin")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-w-xs">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">{t("newPin")}</Label>
                <Input type="password" inputMode="numeric" maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="····"
                  className="text-center text-lg tracking-[0.3em] font-bold" />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">{t("confirmPin")}</Label>
                <Input type="password" inputMode="numeric" maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="····"
                  className="text-center text-lg tracking-[0.3em] font-bold" />
              </div>
              <Button disabled={pinInput.length < 4 || pinInput !== pinConfirm}
                onClick={() => {
                  if (pinInput.length === 4 && pinInput === pinConfirm) {
                    setPin(currentUser.id, pinInput); setPinInput(""); setPinConfirm("");
                    toast.success(t("pinSet"));
                  }
                }}>
                <Lock className="w-4 h-4 mr-1.5" /> {t("activatePin")}
              </Button>
              {pinInput.length === 4 && pinConfirm.length === 4 && pinInput !== pinConfirm && (
                <p className="text-xs text-red-500">{t("pinMismatch")}</p>
              )}
            </div>
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
