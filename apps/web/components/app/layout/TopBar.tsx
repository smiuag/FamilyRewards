"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePinStore } from "@/lib/store/usePinStore";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Star, User, HelpCircle, MapPin, LogOut, ArrowLeftRight, ChevronDown,
} from "lucide-react";

export default function TopBar() {
  const t = useTranslations("nav");
  const ts = useTranslations("sidebar");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";

  const { currentUser, users, logout, setCurrentProfile } = useAppStore();
  const { hasPin, verifyPin } = usePinStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // PIN modal
  const [pinTarget, setPinTarget] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSwitchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  if (!currentUser) return null;

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push(`/${locale}/login`);
  };

  const handleSwitchUser = (targetUserId: string) => {
    if (hasPin(targetUserId)) {
      setPinTarget(targetUserId);
      setPinValue("");
      setPinError(false);
      setMenuOpen(false);
      setSwitchOpen(false);
      setTimeout(() => pinInputRef.current?.focus(), 100);
      return;
    }
    doSwitch(targetUserId);
  };

  const doSwitch = (targetUserId: string) => {
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return;
    setCurrentProfile(target);
    setMenuOpen(false);
    setSwitchOpen(false);
    setPinTarget(null);
    router.push(`/${locale}/dashboard`);
  };

  const handlePinSubmit = () => {
    if (!pinTarget) return;
    if (verifyPin(pinTarget, pinValue)) {
      doSwitch(pinTarget);
    } else {
      setPinError(true);
      setPinValue("");
      pinInputRef.current?.focus();
    }
  };

  const navigate = (href: string) => {
    router.push(href);
    setMenuOpen(false);
  };

  const otherUsers = users.filter((u) => u.id !== currentUser.id);
  const canSwitch = otherUsers.length > 0;

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2.5 bg-background border-b border-border flex-shrink-0">
        {/* Left: points (mobile) / spacer (desktop) */}
        <div className="flex items-center gap-1.5 text-sm text-primary font-semibold lg:invisible">
          <Star className="w-3.5 h-3.5 fill-primary" aria-hidden="true" />
          <span>{currentUser.pointsBalance.toLocaleString()} pts</span>
        </div>

        {/* Right: user menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSwitchOpen(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-muted transition-colors"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <span className="text-xl" aria-hidden="true">{currentUser.avatar}</span>
            <span className="text-sm font-semibold hidden sm:inline">{currentUser.name}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg w-56 py-1.5 overflow-hidden">
              {/* User info header */}
              <div className="px-3 py-2 border-b border-border mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentUser.avatar}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{currentUser.name}</p>
                    <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <Star className="w-3 h-3 fill-primary" />
                      {currentUser.pointsBalance.toLocaleString()} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <MenuItem icon={User} label={t("profile")} onClick={() => navigate(`/${locale}/profile`)} />
              <MenuItem icon={MapPin} label={t("settings")} onClick={() => navigate(`/${locale}/settings`)} />
              <MenuItem icon={HelpCircle} label={t("help")} onClick={() => navigate(`/${locale}/help`)} />

              {/* Switch user */}
              {canSwitch && (
                <>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => setSwitchOpen(!switchOpen)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{ts("switchUser")}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", switchOpen && "rotate-180")} />
                  </button>
                  {switchOpen && (
                    <div className="px-2 pb-1 space-y-0.5">
                      {otherUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSwitchUser(u.id)}
                          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <span className="text-base">{u.avatar}</span>
                          <span className="flex-1 text-left font-medium truncate">{u.name}</span>
                          {hasPin(u.id) && <span className="text-[10px] text-muted-foreground">🔒</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Logout */}
              <div className="border-t border-border my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-red-500"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout")}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* PIN modal */}
      <Dialog open={!!pinTarget} onOpenChange={(open) => { if (!open) setPinTarget(null); }}>
        <DialogContent showCloseButton={false} className="max-w-xs p-6">
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-4xl" aria-hidden="true">{users.find((u) => u.id === pinTarget)?.avatar}</span>
              <p className="font-bold mt-2">{users.find((u) => u.id === pinTarget)?.name}</p>
              <p className="text-sm text-muted-foreground">{ts("enterPin")}</p>
            </div>
            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              aria-label={ts("enterPin")}
              maxLength={4}
              value={pinValue}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPinValue(v);
                setPinError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pinValue.length === 4) handlePinSubmit();
              }}
              className={cn(
                "w-full text-center text-2xl tracking-[0.5em] font-bold border-2 rounded-xl py-3 outline-none transition-colors bg-background text-foreground",
                pinError ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-border focus:border-primary"
              )}
              placeholder="····"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-500 text-center" role="alert">{ts("wrongPin")}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setPinTarget(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinValue.length < 4}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {tc("confirm")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span>{label}</span>
    </button>
  );
}
