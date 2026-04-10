"use client";

import { useState } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import {
  Home,
  CheckSquare,
  Calendar,
  Gift,
  History,
  LogOut,
  Star,
  ChevronDown,
  Users,
  Settings,
  BarChart3,
  ClipboardList,
  BookOpen,
  Layers,
  Zap,
  Flag,
  MapPin,
  HelpCircle,
} from "lucide-react";

type Section = "me" | "family" | "admin";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  alert?: boolean;
}

export default function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser, users, taskInstances, logout, featuresUnlocked, setupVisited } = useAppStore();

  const isAdminRoute = pathname.startsWith(`/${locale}/admin`);
  const isMemberRoute = pathname.startsWith(`/${locale}/members`);

  const activeSection: Section = isAdminRoute ? "admin" : isMemberRoute ? "family" : "me";

  const [openSection, setOpenSection] = useState<Section>(activeSection);

  const meItems: NavItem[] = [
    { href: `/${locale}/dashboard`, icon: Home, label: t("dashboard") },
    { href: `/${locale}/tasks`, icon: CheckSquare, label: t("tasks") },
    { href: `/${locale}/calendar`, icon: Calendar, label: t("calendar") },
    { href: `/${locale}/rewards`, icon: Gift, label: t("rewards") },
    { href: `/${locale}/history`, icon: History, label: t("history") },
  ];

  const adminItems: NavItem[] = [
    { href: `/${locale}/admin/members`, icon: Users, label: t("adminMembers"), alert: !setupVisited.members },
    { href: `/${locale}/admin/tasks`, icon: ClipboardList, label: t("adminTasks") },
    { href: `/${locale}/admin/rewards`, icon: Gift, label: t("adminRewards") },
    { href: `/${locale}/admin/stats`, icon: BarChart3, label: t("adminStats") },
    ...(featuresUnlocked.includes("streaks") ? [
      { href: `/${locale}/admin/challenges`, icon: Flag, label: t("adminChallenges") },
      { href: `/${locale}/admin/multipliers`, icon: Zap, label: t("adminMultipliers") },
    ] : []),
    { href: `/${locale}/admin/catalog/tasks`, icon: BookOpen, label: t("adminCatalogTasks"), alert: !setupVisited.catalogTasks },
    { href: `/${locale}/admin/templates`, icon: Layers, label: t("adminTemplates") },
    { href: `/${locale}/settings`, icon: MapPin, label: t("settings") },
    { href: `/${locale}/help`, icon: HelpCircle, label: t("help") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const toggle = (section: Section) =>
    setOpenSection((prev) => (prev === section ? section : section));

  const handleLogout = () => {
    logout();
    router.push(`/${locale}/login`);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col w-60 bg-sidebar text-sidebar-foreground h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">FamilyRewards</span>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">

        {/* ── YO ── */}
        <SectionHeader
          label="Mi perfil"
          emoji={currentUser?.avatar}
          open={openSection === "me"}
          active={activeSection === "me"}
          onClick={() => setOpenSection("me")}
          badge={currentUser ? `${currentUser.pointsBalance.toLocaleString()} pts` : undefined}
        />
        {openSection === "me" && (
          <div className="space-y-0.5 pb-1">
            {meItems.map((item) => (
              <NavBtn
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>
        )}

        {/* ── FAMILIA ── */}
        <div className="border-t border-sidebar-border mx-1 my-2" />
        <SectionHeader
          label={t("members")}
          emoji="👨‍👩‍👧"
          open={openSection === "family"}
          active={activeSection === "family"}
          onClick={() => setOpenSection("family")}
          badge={`${users.length}`}
        />
        {openSection === "family" && (
          <div className="space-y-0.5 pb-1">
            {users.map((u) => {
              const href = `/${locale}/members/${u.id}`;
              const todayDone = taskInstances.filter(
                (ti) => ti.userId === u.id && ti.date === today && ti.state === "completed"
              ).length;
              const todayTotal = taskInstances.filter(
                (ti) => ti.userId === u.id && ti.date === today
              ).length;
              return (
                <button
                  key={u.id}
                  onClick={() => router.push(href)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-all",
                    isActive(href)
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <span className="text-base flex-shrink-0">{u.avatar}</span>
                  <span className="flex-1 font-medium truncate">{u.name}</span>
                  {todayTotal > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      todayDone === todayTotal
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {todayDone}/{todayTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── ADMINISTRACIÓN ── */}
        {currentUser?.role === "admin" && (
          <>
            <div className="border-t border-sidebar-border mx-1 my-2" />
            <SectionHeader
              label={t("admin")}
              emoji="⚙️"
              open={openSection === "admin"}
              active={activeSection === "admin"}
              onClick={() => setOpenSection("admin")}
            />
            {openSection === "admin" && (
              <div className="space-y-0.5 pb-1">
                {adminItems.map((item) => (
                  <NavBtn
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onClick={() => router.push(item.href)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border flex-shrink-0">
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

function SectionHeader({
  label,
  emoji,
  open,
  active,
  onClick,
  badge,
}: {
  label: string;
  emoji?: string;
  open: boolean;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : open
          ? "text-sidebar-foreground bg-sidebar-accent"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
      )}
    >
      {emoji && <span className="text-sm">{emoji}</span>}
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={cn(
          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          active ? "bg-white/20 text-white" : "bg-sidebar-border"
        )}>
          {badge}
        </span>
      )}
      <ChevronDown
        className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")}
      />
    </button>
  );
}

function NavBtn({
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
          ? "bg-primary/15 text-primary font-semibold"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.alert && (
        <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          !
        </span>
      )}
    </button>
  );
}
