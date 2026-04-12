"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { deleteFamilyAction } from "@/lib/actions/delete-family";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MapPin, Save, Trash2, Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchMinigameConfig, updateMinigameConfig } from "@/lib/api/minigame";
import { updatePetsEnabled } from "@/lib/api/members";
import { useMinigameStore } from "@/lib/store/useMinigameStore";

// Spanish province lookup by postal code prefix (first 2 digits)
const ES_PROVINCES: Record<string, { name: string; region: string }> = {
  "01": { name: "Álava", region: "ES-PV" },
  "02": { name: "Albacete", region: "ES-CM" },
  "03": { name: "Alicante", region: "ES-VC" },
  "04": { name: "Almería", region: "ES-AN" },
  "05": { name: "Ávila", region: "ES-CL" },
  "06": { name: "Badajoz", region: "ES-EX" },
  "07": { name: "Baleares", region: "ES-IB" },
  "08": { name: "Barcelona", region: "ES-CT" },
  "09": { name: "Burgos", region: "ES-CL" },
  "10": { name: "Cáceres", region: "ES-EX" },
  "11": { name: "Cádiz", region: "ES-AN" },
  "12": { name: "Castellón", region: "ES-VC" },
  "13": { name: "Ciudad Real", region: "ES-CM" },
  "14": { name: "Córdoba", region: "ES-AN" },
  "15": { name: "A Coruña", region: "ES-GA" },
  "16": { name: "Cuenca", region: "ES-CM" },
  "17": { name: "Girona", region: "ES-CT" },
  "18": { name: "Granada", region: "ES-AN" },
  "19": { name: "Guadalajara", region: "ES-CM" },
  "20": { name: "Gipuzkoa", region: "ES-PV" },
  "21": { name: "Huelva", region: "ES-AN" },
  "22": { name: "Huesca", region: "ES-AR" },
  "23": { name: "Jaén", region: "ES-AN" },
  "24": { name: "León", region: "ES-CL" },
  "25": { name: "Lleida", region: "ES-CT" },
  "26": { name: "La Rioja", region: "ES-RI" },
  "27": { name: "Lugo", region: "ES-GA" },
  "28": { name: "Madrid", region: "ES-MD" },
  "29": { name: "Málaga", region: "ES-AN" },
  "30": { name: "Murcia", region: "ES-MC" },
  "31": { name: "Navarra", region: "ES-NC" },
  "32": { name: "Ourense", region: "ES-GA" },
  "33": { name: "Asturias", region: "ES-AS" },
  "34": { name: "Palencia", region: "ES-CL" },
  "35": { name: "Las Palmas", region: "ES-CN" },
  "36": { name: "Pontevedra", region: "ES-GA" },
  "37": { name: "Salamanca", region: "ES-CL" },
  "38": { name: "S.C. de Tenerife", region: "ES-CN" },
  "39": { name: "Cantabria", region: "ES-CB" },
  "40": { name: "Segovia", region: "ES-CL" },
  "41": { name: "Sevilla", region: "ES-AN" },
  "42": { name: "Soria", region: "ES-CL" },
  "43": { name: "Tarragona", region: "ES-CT" },
  "44": { name: "Teruel", region: "ES-AR" },
  "45": { name: "Toledo", region: "ES-CM" },
  "46": { name: "Valencia", region: "ES-VC" },
  "47": { name: "Valladolid", region: "ES-CL" },
  "48": { name: "Bizkaia", region: "ES-PV" },
  "49": { name: "Zamora", region: "ES-CL" },
  "50": { name: "Zaragoza", region: "ES-AR" },
  "51": { name: "Ceuta", region: "ES-CE" },
  "52": { name: "Melilla", region: "ES-ML" },
};

function detectLocation(postalCode: string) {
  const clean = postalCode.trim();
  // Spanish postal code: 5 digits, 01xxx–52xxx
  if (/^\d{5}$/.test(clean)) {
    const prefix = clean.slice(0, 2);
    const province = ES_PROVINCES[prefix];
    if (province) {
      return { country: "ES", region: province.region, label: `España · ${province.name}`, flag: "🇪🇸" };
    }
  }
  // Portuguese postal code: 4+3 digits (1000-001)
  if (/^\d{4}-?\d{3}$/.test(clean)) {
    return { country: "PT", region: "PT", label: "Portugal", flag: "🇵🇹" };
  }
  return null;
}

export default function SettingsClient() {
  const t = useTranslations("settings");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser, familyName } = useAppStore();
  const { postalCode, city, setLocation, setPostalCode } = useSettingsStore();

  const [postalInput, setPostalInput] = useState(postalCode);
  const [cityInput, setCityInput] = useState(city);
  const [showUnsub, setShowUnsub] = useState(false);
  const [unsubName, setUnsubName] = useState("");
  const [unsubSaving, setUnsubSaving] = useState(false);

  // Pets admin config
  const [petsEnabled, setPetsEnabled] = useState(
    useAppStore.getState().featuresUnlocked.includes("pets"),
  );
  const [petsSaving, setPetsSaving] = useState(false);

  const handleTogglePets = async (enabled: boolean) => {
    if (!currentUser?.familyId) return;
    setPetsSaving(true);
    try {
      await updatePetsEnabled(currentUser.familyId, enabled);
      setPetsEnabled(enabled);
      if (enabled) {
        useAppStore.getState().unlockFeature("pets");
      } else {
        useAppStore.setState((s) => ({
          featuresUnlocked: s.featuresUnlocked.filter((f) => f !== "pets"),
        }));
      }
      toast.success(t("saveLocation"));
    } catch {
      toast.error("Error");
    } finally {
      setPetsSaving(false);
    }
  };

  // Minigame admin config
  const ts2 = useTranslations("minigame.adminSettings");
  const { loadConfig: loadMinigameConfig } = useMinigameStore();
  const [mgEnabled, setMgEnabled] = useState(false);
  const [mgMaxDaily, setMgMaxDaily] = useState("2");
  const [mgPointsBase, setMgPointsBase] = useState("3");
  const [mgLoaded, setMgLoaded] = useState(false);
  const [mgSaving, setMgSaving] = useState(false);

  // Load minigame config on mount (admin only)
  useState(() => {
    if (currentUser?.role === "admin" && currentUser?.familyId) {
      fetchMinigameConfig(currentUser.familyId)
        .then((cfg) => {
          setMgEnabled(cfg.enabled);
          setMgMaxDaily(cfg.maxDaily != null ? String(cfg.maxDaily) : "");
          setMgPointsBase(String(cfg.pointsBase));
          setMgLoaded(true);
        })
        .catch(() => setMgLoaded(true));
    }
  });

  const handleSaveMinigame = async () => {
    if (!currentUser?.familyId) return;
    setMgSaving(true);
    try {
      const config = {
        enabled: mgEnabled,
        maxDaily: mgMaxDaily.trim() === "" ? null : parseInt(mgMaxDaily, 10),
        pointsBase: parseInt(mgPointsBase, 10) || 10,
      };
      await updateMinigameConfig(currentUser.familyId, config);
      loadMinigameConfig(config);
      if (config.enabled) {
        useAppStore.getState().unlockFeature("minigame");
      }
      toast.success(ts2("saved"));
    } catch {
      toast.error("Error");
    } finally {
      setMgSaving(false);
    }
  };

  const detected = detectLocation(postalInput);

  const handleSave = () => {
    const country = detected?.country ?? "ES";
    const region = detected?.region ?? "ES-MD";
    setPostalCode(postalInput.trim());
    setLocation(country, region, cityInput);
    toast.success(t("locationSaved"), {
      description: t("locationSavedDesc", { location: cityInput || postalInput }),
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>

      {/* Location card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {t("locationTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {t("locationDescription")}
          </p>

          {/* Postal code input */}
          <div>
            <Label htmlFor="settings-postal" className="text-sm font-semibold mb-2 block">{t("postalCodeLabel")}</Label>
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                id="settings-postal"
                autoComplete="postal-code"
                value={postalInput}
                onChange={(e) => setPostalInput(e.target.value)}
                placeholder={t("postalCodePlaceholder")}
                className="text-lg font-bold tracking-wider"
                maxLength={8}
              />
              {detected && (
                <span className="text-2xl flex-shrink-0">{detected.flag}</span>
              )}
            </div>

            {/* Detected location */}
            {postalInput.length >= 4 && (
              <div className={cn(
                "mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                detected
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              )}>
                <MapPin className="w-3.5 h-3.5" />
                {detected ? detected.label : t("postalCodeUnknown")}
              </div>
            )}
          </div>

          {/* City (optional) */}
          <div>
            <Label htmlFor="settings-city" className="text-sm font-semibold mb-2 block">
              {t("cityLabel")} <span className="font-normal text-muted-foreground">{t("cityOptional")}</span>
            </Label>
            <Input
              id="settings-city"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder={t("cityPlaceholder")}
              className="max-w-xs"
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" />
            {t("saveLocation")}
          </Button>
        </CardContent>
      </Card>

      {/* Pets config (admin only) */}
      {currentUser?.role === "admin" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-lg">🐾</span>
              {t("petsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{t("petsEnabled")}</p>
                <p className="text-xs text-muted-foreground">{t("petsEnabledDesc")}</p>
              </div>
              <Switch
                checked={petsEnabled}
                onCheckedChange={handleTogglePets}
                disabled={petsSaving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minigame config (admin only) */}
      {currentUser?.role === "admin" && mgLoaded && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-primary" />
              {ts2("title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Enable toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{ts2("enabled")}</p>
                <p className="text-xs text-muted-foreground">{ts2("enabledDesc")}</p>
              </div>
              <Switch checked={mgEnabled} onCheckedChange={setMgEnabled} />
            </div>

            {mgEnabled && (
              <>
                {/* Max daily games */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">{ts2("maxDaily")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={mgMaxDaily}
                    onChange={(e) => setMgMaxDaily(e.target.value)}
                    placeholder={ts2("maxDailyDesc")}
                    className="max-w-xs"
                  />
                </div>

                {/* Points per game */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">{ts2("pointsPerGame")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={mgPointsBase}
                    onChange={(e) => setMgPointsBase(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </>
            )}

            <Button onClick={handleSaveMinigame} disabled={mgSaving}>
              <Save className="w-4 h-4 mr-1.5" />
              {mgSaving ? "..." : t("saveLocation")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="shadow-sm border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <Trash2 className="w-4 h-4" />
            {t("dangerZone")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("dangerDescription")}</p>
          {!showUnsub ? (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => { setUnsubName(""); setShowUnsub(true); }}
            >
              {t("deleteFamily")}
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <p className="font-semibold">{t("deleteWarningTitle")}</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>{t("deleteWarning1")}</li>
                  <li>{t("deleteWarning2")}</li>
                  <li>{t("deleteWarning3")}</li>
                  <li>{t("deleteWarning4")}</li>
                </ul>
              </div>
              <div>
                <Label className="text-sm">{t("deleteConfirmLabel", { name: familyName })}</Label>
                <Input
                  value={unsubName}
                  onChange={(e) => setUnsubName(e.target.value)}
                  placeholder={familyName}
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowUnsub(false)}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={unsubSaving || unsubName.trim().toLowerCase() !== (familyName || "").trim().toLowerCase()}
                  onClick={async () => {
                    if (!currentUser?.familyId) return;
                    setUnsubSaving(true);
                    try {
                      await deleteFamilyAction({
                        familyId: currentUser.familyId,
                        confirmName: unsubName,
                      });
                      const supabase = (await import("@/lib/supabase/client")).createClient();
                      await supabase.auth.signOut();
                      useAppStore.getState().logout();
                      router.push(`/${locale}/login`);
                      toast.success(t("deleteFamilySuccess"));
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : t("deleteFamilyError"));
                    } finally {
                      setUnsubSaving(false);
                    }
                  }}
                >
                  {unsubSaving ? t("deleteFamilyDeleting") : t("deleteFamilyConfirm")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
