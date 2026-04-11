"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { fetchFamilyTasks, backfillInstances } from "@/lib/api/tasks";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { getHolidaysForMonth, getHolidayForDate } from "@/lib/holidays";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, MinusCircle, XCircle, MapPin } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function CalendarClient() {
  const t = useTranslations("calendar");
  const { currentUser, tasks, taskInstances } = useAppStore();
  const { country, region, city } = useSettingsStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      let t = useAppStore.getState().tasks;
      if (t.length === 0) {
        t = await fetchFamilyTasks();
        useAppStore.setState({ tasks: t });
      }
      const instances = await backfillInstances(t, currentUser.id, new Date());
      useAppStore.setState((prev) => ({
        taskInstances: [
          ...prev.taskInstances.filter((ti) => ti.userId !== currentUser.id),
          ...instances,
        ],
      }));
    })().catch(() => {});
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Holidays for this month
  const holidays = getHolidaysForMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    country,
    region
  );

  const selectedDateStr = format(selectedDay, "yyyy-MM-dd");
  const selectedInstances = taskInstances.filter(
    (ti) => ti.userId === currentUser.id && ti.date === selectedDateStr
  );
  const selectedHoliday = getHolidayForDate(selectedDateStr, country, region);

  const getInstancesForDay = (day: Date) =>
    taskInstances.filter(
      (ti) =>
        ti.userId === currentUser.id &&
        ti.date === format(day, "yyyy-MM-dd")
    );

  const stateColors: Record<string, string> = {
    completed: "bg-green-500",
    pending: "bg-amber-400",
    failed: "bg-red-400",
    cancelled: "bg-gray-300",
  };

  const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        {city && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            <span>{city}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-base capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {weekdays.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day) => {
                  const instances = getInstancesForDay(day);
                  const isSelected = isSameDay(day, selectedDay);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDay = isToday(day);
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayHolidays = holidays.get(dayKey) ?? [];
                  const hasHoliday = dayHolidays.length > 0;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-xl p-1 text-sm transition-all relative",
                        isSelected && "bg-primary text-primary-foreground shadow-sm",
                        !isSelected && isTodayDay && "border-2 border-primary text-primary font-bold",
                        !isSelected && hasHoliday && isCurrentMonth && "bg-red-50",
                        !isSelected && !isTodayDay && !hasHoliday && isCurrentMonth && "hover:bg-muted text-foreground",
                        !isCurrentMonth && "text-muted-foreground/40"
                      )}
                    >
                      {/* Holiday indicator */}
                      {hasHoliday && !isSelected && isCurrentMonth && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                      )}

                      <span className="font-medium leading-none">{format(day, "d")}</span>

                      {/* Holiday emoji */}
                      {hasHoliday && isCurrentMonth && (
                        <span className="text-[8px] leading-none mt-0.5">
                          {dayHolidays[0].emoji}
                        </span>
                      )}

                      {/* Task dots */}
                      {instances.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {instances.slice(0, 3).map((ti) => (
                            <div
                              key={ti.id}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                isSelected ? "bg-primary-foreground/70" : stateColors[ti.state] ?? "bg-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Completada</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>Festivo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected day detail */}
        <div className="space-y-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize">
                {format(selectedDay, "EEEE, d MMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Holiday banner */}
              {selectedHoliday && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <span className="text-xl">{selectedHoliday.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-red-700">{selectedHoliday.name}</p>
                    <p className="text-xs text-red-500 capitalize">{selectedHoliday.type === "national" ? "Festivo nacional" : "Festivo regional"}</p>
                  </div>
                </div>
              )}

              {selectedInstances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noTasksDay")}
                </p>
              ) : (
                selectedInstances.map((ti) => {
                  const task = tasks.find((tk) => tk.id === ti.taskId);
                  return (
                    <div key={ti.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      {ti.state === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      {ti.state === "pending" && <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      {ti.state === "failed" && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      {ti.state === "cancelled" && <MinusCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task?.title}</p>
                        <p className="text-xs text-muted-foreground">+{task?.points} pts</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border-0",
                          ti.state === "completed" && "bg-green-100 text-green-700",
                          ti.state === "pending"   && "bg-amber-100 text-amber-700",
                          ti.state === "failed"    && "bg-red-100 text-red-600",
                          ti.state === "cancelled" && "bg-gray-100 text-gray-500",
                        )}
                      >
                        {ti.state === "completed" && "✓"}
                        {ti.state === "pending"   && "⏳"}
                        {ti.state === "failed"    && "✗"}
                        {ti.state === "cancelled" && "—"}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Holidays this month */}
          {holidays.size > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Festivos este mes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-0">
                {Array.from(holidays.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, hs]) =>
                    hs.map((h) => (
                      <div key={`${date}-${h.name}`} className="flex items-center gap-2 text-xs">
                        <span>{h.emoji}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(date + "T12:00:00"), "d MMM", { locale: es })}
                        </span>
                        <span className="font-medium text-foreground truncate">{h.name}</span>
                      </div>
                    ))
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
