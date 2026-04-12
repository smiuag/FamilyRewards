"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePinStore } from "@/lib/store/usePinStore";
import { setVacationMode } from "@/lib/api/members";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Save, Lock, Trash2, Palmtree } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const { postalCode, city, setLocation, setPostalCode } = useSettingsStore();
  const { currentUser } = useAppStore();
  const { hasPin, setPin, removePin } = usePinStore();

  const [postalInput, setPostalInput] = useState(postalCode);
  const [cityInput, setCityInput] = useState(city);

  // PIN state
  const currentHasPin = currentUser ? hasPin(currentUser.id) : false;
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [vacationDate, setVacationDate] = useState(currentUser?.vacationUntil ?? "");
  const [vacationSaving, setVacationSaving] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];
  const isOnVacation = currentUser?.vacationUntil && currentUser.vacationUntil >= todayStr;

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

      {/* Vacation card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palmtree className="w-4 h-4 text-teal-600" />
            {t("vacationTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("vacationDescription")}
          </p>

          {isOnVacation && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-800">
              <p className="font-semibold">{t("vacationActive")}</p>
              <p>{t("vacationUntilDate", { date: currentUser!.vacationUntil! })}</p>
            </div>
          )}

          <div className="max-w-xs">
            <Label htmlFor="settings-vacation" className="text-sm font-semibold mb-1.5 block">
              {t("vacationDateLabel")}
            </Label>
            <Input
              id="settings-vacation"
              type="date"
              value={vacationDate}
              onChange={(e) => setVacationDate(e.target.value)}
              min={todayStr}
            />
          </div>

          <div className="flex gap-2">
            <Button
              disabled={vacationSaving || !vacationDate}
              onClick={async () => {
                if (!currentUser) return;
                setVacationSaving(true);
                try {
                  await setVacationMode(currentUser.id, vacationDate);
                  useAppStore.setState((prev) => ({
                    currentUser: prev.currentUser ? { ...prev.currentUser, vacationUntil: vacationDate } : prev.currentUser,
                    users: prev.users.map((u) => u.id === currentUser.id ? { ...u, vacationUntil: vacationDate } : u),
                  }));
                  toast.success(t("vacationActivated", { date: vacationDate }));
                } catch {
                  toast.error(t("vacationError"));
                } finally {
                  setVacationSaving(false);
                }
              }}
            >
              <Palmtree className="w-4 h-4 mr-1.5" />
              {vacationSaving ? t("vacationSaving") : t("vacationActivate")}
            </Button>
            {isOnVacation && (
              <Button
                variant="outline"
                disabled={vacationSaving}
                onClick={async () => {
                  if (!currentUser) return;
                  setVacationSaving(true);
                  try {
                    await setVacationMode(currentUser.id, null);
                    useAppStore.setState((prev) => ({
                      currentUser: prev.currentUser ? { ...prev.currentUser, vacationUntil: null } : prev.currentUser,
                      users: prev.users.map((u) => u.id === currentUser.id ? { ...u, vacationUntil: null } : u),
                    }));
                    setVacationDate("");
                    toast.success(t("vacationDeactivated"));
                  } catch {
                    toast.error(t("vacationError"));
                  } finally {
                    setVacationSaving(false);
                  }
                }}
              >
                {t("vacationDeactivate")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PIN card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {t("pinTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("pinDescription")}
          </p>

          {currentHasPin ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                {t("pinActive")}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (currentUser) {
                    removePin(currentUser.id);
                    toast.success(t("pinDeleted"));
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {t("deletePin")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-w-xs">
              <div>
                <Label htmlFor="settings-pin" className="text-sm font-semibold mb-1.5 block">{t("newPin")}</Label>
                <Input
                  id="settings-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={t("newPinPlaceholder")}
                  className="text-center text-lg tracking-[0.3em] font-bold"
                />
              </div>
              <div>
                <Label htmlFor="settings-pin-confirm" className="text-sm font-semibold mb-1.5 block">{t("confirmPin")}</Label>
                <Input
                  id="settings-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={t("confirmPinPlaceholder")}
                  className="text-center text-lg tracking-[0.3em] font-bold"
                />
              </div>
              <Button
                disabled={pinInput.length < 4 || pinInput !== pinConfirm}
                onClick={() => {
                  if (currentUser && pinInput.length === 4 && pinInput === pinConfirm) {
                    setPin(currentUser.id, pinInput);
                    setPinInput("");
                    setPinConfirm("");
                    toast.success(t("pinSet"));
                  }
                }}
              >
                <Lock className="w-4 h-4 mr-1.5" />
                {t("activatePin")}
              </Button>
              {pinInput.length === 4 && pinConfirm.length === 4 && pinInput !== pinConfirm && (
                <p className="text-xs text-red-500">{t("pinMismatch")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
