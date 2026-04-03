"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_TASKS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, MinusCircle } from "lucide-react";
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
  const { currentUser, taskInstances } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  if (!currentUser) return null;

  // Get all days for current month view (including prev/next month padding)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Get instances for selected day
  const selectedDateStr = format(selectedDay, "yyyy-MM-dd");
  const selectedInstances = taskInstances.filter(
    (ti) => ti.userId === currentUser.id && ti.date === selectedDateStr
  );

  const getInstancesForDay = (day: Date) =>
    taskInstances.filter(
      (ti) =>
        ti.userId === currentUser.id &&
        ti.date === format(day, "yyyy-MM-dd")
    );

  const stateColors: Record<string, string> = {
    completed: "bg-green-500",
    pending: "bg-amber-400",
    not_completed: "bg-red-400",
    omitted: "bg-gray-300",
  };

  const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>

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

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-xl p-1 text-sm transition-all",
                        isSelected && "bg-primary text-primary-foreground shadow-sm",
                        !isSelected && isTodayDay && "border-2 border-primary text-primary font-bold",
                        !isSelected && !isTodayDay && isCurrentMonth && "hover:bg-muted text-foreground",
                        !isCurrentMonth && "text-muted-foreground/40"
                      )}
                    >
                      <span className="font-medium leading-none">{format(day, "d")}</span>
                      {instances.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {instances.slice(0, 3).map((ti) => (
                            <div
                              key={ti.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
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
            </CardContent>
          </Card>
        </div>

        {/* Selected day detail */}
        <div>
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base capitalize">
                {format(selectedDay, "EEEE, d MMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedInstances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t("noTasksDay")}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedInstances.map((ti) => {
                    const task = MOCK_TASKS.find((tk) => tk.id === ti.taskId);
                    return (
                      <div key={ti.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        {ti.state === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        {ti.state === "pending" && <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        {ti.state === "omitted" && <MinusCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        {ti.state === "not_completed" && <MinusCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task?.title}</p>
                          <p className="text-xs text-muted-foreground">+{task?.points} pts</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs border-0",
                            ti.state === "completed" && "bg-green-100 text-green-700",
                            ti.state === "pending" && "bg-amber-100 text-amber-700",
                            ti.state === "omitted" && "bg-gray-100 text-gray-500",
                            ti.state === "not_completed" && "bg-red-100 text-red-600"
                          )}
                        >
                          {ti.state === "completed" && "✓"}
                          {ti.state === "pending" && "⏳"}
                          {ti.state === "omitted" && "—"}
                          {ti.state === "not_completed" && "✗"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
