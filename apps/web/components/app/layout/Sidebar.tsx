"use client";

import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  Home,
  CheckSquare,
  Calendar,
  Gift,
  Users,
  User,
  LogOut,
  Star,
  Settings,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export default function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser, logout } = useAppStore();

  const mainItems: NavItem[] = [
    { href: `/${locale}/dashboard`, icon: Home, label: t("dashboard") },
    { href: `/${locale}/tasks`, icon: CheckSquare, label: t("tasks") },
    { href: `/${locale}/calendar`, icon: Calendar, label: t("calendar") },
    { href: `/${locale}/rewards`, icon: Gift, label: t("rewards") },
    { href: `/${locale}/members`, icon: Users, label: t("members") },
    { href: `/${locale}/profile`, icon: User, label: t("profile") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  return (
    <div className="flex flex-col w-60 bg-sidebar text-sidebar-foreground h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">FamilyRewards</span>
      </div>

      {/* User card */}
      {currentUser && (
        <button
          onClick={() => router.push(`/${locale}/profile`)}
          className="px-4 py-3 mx-3 mt-3 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-border flex items-center justify-center text-xl">
              {currentUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/60">
                ⭐ {currentUser.pointsBalance.toLocaleString()} pts
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-sidebar-foreground/30 flex-shrink-0" />
          </div>
        </button>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={() => router.push(item.href)}
          />
        ))}
      </nav>

      {/* Bottom: admin + settings + logout */}
      <div className="px-3 pb-4 pt-3 border-t border-sidebar-border space-y-0.5">
        {currentUser?.role === "admin" && (
          <SidebarItem
            item={{ href: `/${locale}/admin/members`, icon: Settings, label: t("admin") }}
            active={pathname.startsWith(`/${locale}/admin`)}
            onClick={() => router.push(`/${locale}/admin/members`)}
          />
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{item.label}</span>
    </button>
  );
}
