"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, Calendar, Gift, User, Trophy, MessageSquare } from "lucide-react";

export default function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const currentUser = useAppStore((s) => s.currentUser);

  const items = [
    { href: `/${locale}/dashboard`, icon: Home, label: "Inicio" },
    { href: `/${locale}/tasks`, icon: CheckSquare, label: "Tareas" },
    { href: `/${locale}/rewards`, icon: Gift, label: "Premios" },
    { href: `/${locale}/achievements`, icon: Trophy, label: "Logros" },
    { href: `/${locale}/board`, icon: MessageSquare, label: "Tablón" },
  ];

  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-around bg-white border-t border-border py-2 px-2 safe-area-inset-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
              active
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "fill-primary/10")} />
            <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
