"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { updateFamilyName } from "@/lib/api/members";
import { cn } from "@/lib/utils";
import {
  Home,
  CheckSquare,
  Calendar,
  Gift,
  History,
  Users,
  BarChart3,
  ClipboardList,
  Zap,
  Flag,
  Settings,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  alert?: boolean;
}

export default function Sidebar() {
  const t = useTranslations("nav");
  const ts = useTranslations("sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const {
    currentUser, users, tasks, rewards,
    catalogsLoaded, featuresUnlocked,
    familyName, setFamilyName,
  } = useAppStore();

  // Edición inline del nombre de familia
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(familyName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const meItems: NavItem[] = [
    { href: `/${locale}/dashboard`, icon: Home, label: t("dashboard") },
    { href: `/${locale}/tasks`, icon: CheckSquare, label: t("tasks") },
    { href: `/${locale}/calendar`, icon: Calendar, label: t("calendar") },
    { href: `/${locale}/rewards`, icon: Gift, label: t("rewards") },
    { href: `/${locale}/history`, icon: History, label: t("history") },
  ];

  const dataLoaded = users.length > 0 && catalogsLoaded;
  const needsMembers = dataLoaded && users.length < 2;
  const needsTasks = dataLoaded && tasks.length === 0;
  const needsRewards = dataLoaded && rewards.length === 0;

  const adminItems: NavItem[] = [
    { href: `/${locale}/admin/members`, icon: Users, label: t("adminMembers"), alert: needsMembers },
    { href: `/${locale}/admin/tasks`, icon: ClipboardList, label: t("adminTasks"), alert: needsTasks },
    { href: `/${locale}/admin/rewards`, icon: Gift, label: t("adminRewards"), alert: needsRewards },
    { href: `/${locale}/admin/stats`, icon: BarChart3, label: t("adminStats") },
    { href: `/${locale}/settings`, icon: Settings, label: t("settings") },
    ...(featuresUnlocked.includes("streaks") ? [
      { href: `/${locale}/admin/challenges`, icon: Flag, label: t("adminChallenges") },
      { href: `/${locale}/admin/multipliers`, icon: Zap, label: t("adminMultipliers") },
    ] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || !currentUser?.familyId) {
      setEditingName(false);
      setNameValue(familyName);
      return;
    }
    try {
      await updateFamilyName(currentUser.familyId, trimmed);
      setFamilyName(trimmed);
      toast.success(ts("familyNameUpdated"));
    } catch {
      toast.error(ts("familyNameError"));
      setNameValue(familyName);
    }
    setEditingName(false);
  };

  return (
    <div className="flex flex-col w-60 bg-sidebar text-sidebar-foreground h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-family.png"
          alt="FamilyRewards"
          width={36}
          height={36}
          className="rounded-xl shadow-sm flex-shrink-0"
        />
        {editingName ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") {
                  setEditingName(false);
                  setNameValue(familyName);
                }
              }}
              className="flex-1 min-w-0 text-sm font-bold bg-sidebar-accent px-2 py-1 rounded-lg border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button onClick={handleSaveName} className="text-green-600 hover:text-green-700 p-0.5">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setEditingName(false); setNameValue(familyName); }}
              className="text-muted-foreground hover:text-foreground p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (currentUser?.role === "admin") {
                setNameValue(familyName);
                setEditingName(true);
              }
            }}
            className={cn(
              "font-extrabold tracking-tight text-left flex-1 min-w-0",
              currentUser?.role === "admin" && "hover:text-primary transition-colors group",
              familyName.length <= 14 ? "text-lg" :
              familyName.length <= 20 ? "text-base" : "text-sm"
            )}
            title={currentUser?.role === "admin" ? ts("editName") : undefined}
          >
            <span className="flex items-center gap-1.5">
              <span className="line-clamp-2 break-words">{familyName}</span>
              {currentUser?.role === "admin" && (
                <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
              )}
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Menú principal">

        {/* Section label */}
        <SectionLabel label={ts("myProfile")} />

        {meItems.map((item) => (
          <NavBtn
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onClick={() => router.push(item.href)}
          />
        ))}

        {/* Admin section */}
        {currentUser?.role === "admin" && (
          <>
            <div className="border-t border-sidebar-border mx-1 my-3" />
            <SectionLabel label={t("admin")} />

            {adminItems.map((item) => (
              <NavBtn
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => router.push(item.href)}
              />
            ))}
          </>
        )}
      </nav>
    </div>
  );
}

function SectionLabel({ emoji, label, badge }: { emoji?: string; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
      {emoji && <span className="text-sm" aria-hidden="true">{emoji}</span>}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sidebar-border" aria-hidden="true">
          {badge}
        </span>
      )}
    </div>
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
      aria-current={active ? "page" : undefined}
      aria-label={item.alert ? `${item.label} (requiere atención)` : item.label}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-primary/15 text-primary font-semibold"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.alert && (
        <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">
          !
        </span>
      )}
    </button>
  );
}
