"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyProfiles } from "@/lib/api/members";
import { fetchFamilyTasks, backfillInstances } from "@/lib/api/tasks";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Star, ChevronRight } from "lucide-react";

export default function MembersClient() {
  const t = useTranslations("members");
  const { users, taskInstances } = useAppStore();

  useEffect(() => {
    (async () => {
      const profiles = await fetchFamilyProfiles();
      useAppStore.setState({ users: profiles });
      let t = useAppStore.getState().tasks;
      if (t.length === 0) {
        t = await fetchFamilyTasks();
        useAppStore.setState({ tasks: t });
      }
      // Backfill for all members
      for (const u of profiles) {
        const instances = await backfillInstances(t, u.id, new Date());
        useAppStore.setState((prev) => ({
          taskInstances: [
            ...prev.taskInstances.filter((ti) => ti.userId !== u.id),
            ...instances,
          ],
        }));
      }
    })().catch(() => {});
  }, []);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const today = new Date().toISOString().split("T")[0];

  const getStats = (userId: string) => {
    const todayInstances = taskInstances.filter(
      (ti) => ti.userId === userId && ti.date === today
    );
    const completedToday = todayInstances.filter((ti) => ti.state === "completed");
    const pendingToday = todayInstances.filter((ti) => ti.state === "pending");
    const ptsToday = completedToday.reduce((a, ti) => a + ti.pointsAwarded, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekInstances = taskInstances.filter(
      (ti) => ti.userId === userId && ti.date >= weekStartStr && ti.state === "completed"
    );
    const ptsWeek = weekInstances.reduce((a, ti) => a + ti.pointsAwarded, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];
    const monthInstances = taskInstances.filter(
      (ti) => ti.userId === userId && ti.date >= monthStartStr && ti.state === "completed"
    );
    const ptsMonth = monthInstances.reduce((a, ti) => a + ti.pointsAwarded, 0);

    return {
      totalToday: todayInstances.length,
      completedToday: completedToday.length,
      pendingToday: pendingToday.length,
      ptsToday,
      ptsWeek,
      ptsMonth,
    };
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const stats = getStats(user.id);
          return (
            <Card
              key={user.id}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/${locale}/members/${user.id}`)}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                    {user.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base">{user.name}</span>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                        {user.role === "admin" ? t("admin") : t("member")}
                      </Badge>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-primary font-bold">
                        <Star className="w-3.5 h-3.5 fill-primary" />
                        <span>{user.pointsBalance.toLocaleString()} pts</span>
                      </div>
                      {stats.totalToday > 0 && (
                        <>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{stats.completedToday}/{stats.totalToday} hoy</span>
                          </div>
                          {stats.pendingToday > 0 && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{stats.pendingToday} pendiente{stats.pendingToday > 1 ? "s" : ""}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Week / Month points */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>Semana: <span className="font-semibold text-foreground">{stats.ptsWeek} pts</span></span>
                      <span>·</span>
                      <span>Mes: <span className="font-semibold text-foreground">{stats.ptsMonth} pts</span></span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
