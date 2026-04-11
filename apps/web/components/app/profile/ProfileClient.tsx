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
import { Star, Sun, Moon, Globe, Lock, Trash2, Palette } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfileClient() {
  const t = useTranslations("profile");
  const tRoles = useTranslations("roles");
  const { currentUser, transactions, loadTransactions } = useAppStore();
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted border shadow-sm flex items-center justify-center text-3xl">
          {currentUser.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold">{currentUser.name}</h1>
            <Badge variant={currentUser.role === "admin" ? "default" : "secondary"} className="text-[10px]">
              {tRoles(currentUser.role)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="font-bold text-primary">{currentUser.pointsBalance.toLocaleString()}</span>
            <span>{t("totalPoints")}</span>
          </div>
        </div>
      </div>

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
            {(["light", "dark"] as const).map((opt) => (
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
              <span className="text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1.5 rounded-lg">
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
                      <span className={cn("font-bold text-sm", tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
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

