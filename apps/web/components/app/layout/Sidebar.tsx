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
  User,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Star,
  ClipboardList,
  BookOpen,
  MapPin,
  Trophy,
  MessageSquare,
  Layers,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  adminOnly?: boolean;
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
    { href: `/${locale}/achievements`, icon: Trophy, label: "Logros" },
    { href: `/${locale}/board`, icon: MessageSquare, label: "Tablón familiar" },
    { href: `/${locale}/profile`, icon: User, label: t("profile") },
  ];

  const adminItems: NavItem[] = [
    {
      href: `/${locale}/admin/members`,
      icon: Users,
      label: t("adminMembers"),
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/tasks`,
      icon: ClipboardList,
      label: t("adminTasks"),
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/rewards`,
      icon: Settings,
      label: t("adminRewards"),
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/stats`,
      icon: BarChart3,
      label: t("adminStats"),
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/catalog/rewards`,
      icon: BookOpen,
      label: "Catálogo recompensas",
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/catalog/tasks`,
      icon: BookOpen,
      label: "Catálogo tareas",
      adminOnly: true,
    },
    {
      href: `/${locale}/admin/templates`,
      icon: Layers,
      label: "Plantillas temporada",
      adminOnly: true,
    },
  ];

  const settingsItems: NavItem[] = [
    { href: `/${locale}/settings`, icon: MapPin, label: "Localización" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  return (
    <div className="flex flex-col w-64 bg-sidebar text-sidebar-foreground h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">FamilyRewards</span>
      </div>

      {/* User card */}
      {currentUser && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-sidebar-accent">
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
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-1 overflow-y-auto">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={() => router.push(item.href)}
          />
        ))}

        {/* Admin section */}
        {currentUser?.role === "admin" && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1">
              Admin
            </p>
            {adminItems.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => router.push(item.href)}
              />
            ))}
          </>
        )}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-2 border-t border-sidebar-border pt-3">
        <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-1">
          Config.
        </p>
        {settingsItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={() => router.push(item.href)}
          />
        ))}
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
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
