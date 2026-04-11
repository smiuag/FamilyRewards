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
  LogOut,
  ChevronDown,
  Users,
  Settings,
  BarChart3,
  ClipboardList,
  Zap,
  Flag,
  MapPin,
  HelpCircle,
  Pencil,
  Check,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";

type Section = "me" | "admin";

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
  const {
    currentUser, users, tasks, rewards, logout,
    featuresUnlocked,
    familyName, setFamilyName, setCurrentProfile,
  } = useAppStore();

  const isAdminRoute = pathname.startsWith(`/${locale}/admin`);

  const activeSection: Section = isAdminRoute ? "admin" : "me";

  const [openSection, setOpenSection] = useState<Section>(activeSection);

  // Sincronizar sección abierta cuando cambia la ruta
  useEffect(() => {
    setOpenSection(activeSection);
  }, [activeSection]);

  // Edición inline del nombre de familia
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(familyName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Cambio de usuario
  const [showSwitchUser, setShowSwitchUser] = useState(false);

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

  // Alertas dinámicas: mostrar ! cuando falta configuración esencial
  const needsMembers = users.length < 2;
  const needsTasks = tasks.length === 0;
  const needsRewards = rewards.length === 0;

  const adminItems: NavItem[] = [
    { href: `/${locale}/admin/members`, icon: Users, label: t("adminMembers"), alert: needsMembers },
    { href: `/${locale}/admin/tasks`, icon: ClipboardList, label: t("adminTasks"), alert: needsTasks },
    { href: `/${locale}/admin/rewards`, icon: Gift, label: t("adminRewards"), alert: needsRewards },
    { href: `/${locale}/admin/stats`, icon: BarChart3, label: t("adminStats") },
    ...(featuresUnlocked.includes("streaks") ? [
      { href: `/${locale}/admin/challenges`, icon: Flag, label: t("adminChallenges") },
      { href: `/${locale}/admin/multipliers`, icon: Zap, label: t("adminMultipliers") },
    ] : []),
    { href: `/${locale}/settings`, icon: MapPin, label: t("settings") },
    { href: `/${locale}/help`, icon: HelpCircle, label: t("help") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push(`/${locale}/login`);
  };

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
      toast.success("Nombre de familia actualizado");
    } catch {
      toast.error("Error al actualizar el nombre");
      setNameValue(familyName);
    }
    setEditingName(false);
  };

  const handleSwitchUser = (targetUserId: string) => {
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return;
    setCurrentProfile(target);
    setShowSwitchUser(false);
    router.push(`/${locale}/dashboard`);
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
            title={currentUser?.role === "admin" ? "Editar nombre" : undefined}
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

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">

        {/* -- YO -- */}
        <SectionHeader
          label="Mi perfil"
          emoji={currentUser?.avatar}
          open={openSection === "me"}
          active={activeSection === "me"}
          onClick={() => {
            setOpenSection("me");
            if (openSection !== "me") router.push(`/${locale}/dashboard`);
          }}
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

        {/* -- ADMINISTRACION -- */}
        {currentUser?.role === "admin" && (
          <>
            <div className="border-t border-sidebar-border mx-1 my-2" />
            <SectionHeader
              label={t("admin")}
              emoji="⚙️"
              open={openSection === "admin"}
              active={activeSection === "admin"}
              onClick={() => {
                setOpenSection("admin");
                if (openSection !== "admin") router.push(`/${locale}/admin/members`);
              }}
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

      {/* Footer: Switch user + Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-sidebar-border flex-shrink-0 space-y-1">
        {/* Switch user (admin only) */}
        {currentUser?.role === "admin" && users.length > 1 && (
          <div>
            <button
              onClick={() => setShowSwitchUser(!showSwitchUser)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Cambiar de usuario</span>
            </button>

            {showSwitchUser && (
              <div className="mt-1 bg-sidebar-accent rounded-xl p-2 space-y-1">
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u.id)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm hover:bg-background transition-colors"
                    >
                      <span className="text-base">{u.avatar}</span>
                      <span className="flex-1 text-left font-medium truncate">{u.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Logout */}
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
