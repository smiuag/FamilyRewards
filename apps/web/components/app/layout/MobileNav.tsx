"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { Home, CheckSquare, Gift, Users, User } from "lucide-react";

export default function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const currentUser = useAppStore((s) => s.currentUser);

  const items = [
    { href: `/${locale}/dashboard`, icon: Home, label: t("dashboard") },
    { href: `/${locale}/tasks`, icon: CheckSquare, label: t("tasks") },
    { href: `/${locale}/rewards`, icon: Gift, label: t("rewards") },
    { href: `/${locale}/members`, icon: Users, label: t("members") },
    { href: `/${locale}/profile`, icon: User, label: t("profile") },
  ];

  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-around bg-background border-t border-border py-2 px-2 safe-area-inset-bottom" role="navigation" aria-label="Navegación principal">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", active && "fill-primary/10")} aria-hidden="true" />
            <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
