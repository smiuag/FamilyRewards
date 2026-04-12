"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter as useIntlRouter, usePathname as useIntlPathname } from "@/i18n/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { useThemeStore } from "@/lib/store/useThemeStore";
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
import { updateProfile } from "@/lib/api/members";
import { getLevelForAchievementCount, getNextLevel } from "@/lib/levels";
import { ACHIEVEMENTS, type UserStats } from "@/lib/achievements";
import { Progress } from "@/components/ui/progress";
import { Sun, Moon, Globe, Palette, Cake } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfileClient() {
  const t = useTranslations("profile");
  const tRoles = useTranslations("roles");
  const { currentUser, users, transactions, taskInstances, claims, rewards, loadTransactions, updateMember } = useAppStore();
  const { theme, setTheme } = useThemeStore();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();
  const params = useParams();
  const locale = params?.locale as string ?? "es";

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

  // Achievement count for level
  const myInstances = taskInstances.filter((ti) => ti.userId === currentUser.id);
  const completed = myInstances.filter((ti) => ti.state === "completed");
  const completedDays = new Set(completed.map((ti) => ti.date));
  const sortedDays = Array.from(completedDays).sort();
  let bestStreak = 0, runStreak = 0;
  let prevDate: Date | null = null;
  for (const ds of sortedDays) {
    const d = new Date(ds);
    if (prevDate) {
      const diff = (d.getTime() - prevDate.getTime()) / 86400000;
      runStreak = diff === 1 ? runStreak + 1 : 1;
    } else { runStreak = 1; }
    bestStreak = Math.max(bestStreak, runStreak);
    prevDate = d;
  }
  const approvedClaims = claims.filter((c) => c.userId === currentUser.id && c.status === "approved");
  const simpleStats: UserStats = {
    totalTasksCompleted: completed.length,
    currentStreak: 0, bestStreak,
    totalPoints: currentUser.pointsBalance,
    rewardsClaimed: approvedClaims.length,
    perfectWeeks: 0,
    totalPointsEarned: completed.reduce((s, ti) => s + ti.pointsAwarded, 0),
    daysActive: completedDays.size,
    hasEarlyCompletion: false,
    maxRewardCost: approvedClaims.reduce((max, c) => {
      const r = rewards.find((rw) => rw.id === c.rewardId);
      return r ? Math.max(max, r.pointsCost) : max;
    }, 0),
    boardMessagesPosted: 0, reactionsGiven: 0, reactionsReceived: 0,
    maxDistinctEmojisOnOneMessage: 0, hasClaimedTask: false,
    minigamesPlayed: 0, perfectMinigames: 0, bestTimeEasy: null, bestTimeHard: null,
  };
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.condition(simpleStats)).length;
  const currentLevel = getLevelForAchievementCount(unlockedCount);
  const nextLevel = getNextLevel(currentLevel);
  const levelTitle = locale === "en" ? currentLevel.titleEn : currentLevel.titleEs;
  const nextLevelTitle = nextLevel ? (locale === "en" ? nextLevel.titleEn : nextLevel.titleEs) : null;

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
        </div>
      </div>

      {/* Level */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentLevel.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold">{t("level")} {currentLevel.level}</span>
                <Badge variant="secondary" className="text-xs">{levelTitle}</Badge>
              </div>
              {nextLevel ? (
                <div className="mt-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{unlockedCount} / {nextLevel.minAchievements} {t("achievementsForNext")}</span>
                    <span>{nextLevelTitle}</span>
                  </div>
                  <Progress value={(unlockedCount / nextLevel.minAchievements) * 100} className="h-2" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">{t("maxLevel")}</p>
              )}
            </div>
          </div>
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

      {/* Birthday */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="w-4 h-4 text-primary" />
            {t("birthDate")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{t("birthDateDescription")}</p>
          <input
            type="date"
            value={currentUser.birthDate ?? ""}
            onChange={async (e) => {
              const val = e.target.value || null;
              try {
                await updateProfile(currentUser.id, { birth_date: val });
                updateMember(currentUser.id, { birthDate: val });
                toast.success(t("birthDateSaved"));
              } catch {
                toast.error("Error");
              }
            }}
            className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
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

