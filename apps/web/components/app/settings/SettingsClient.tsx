"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePinStore } from "@/lib/store/usePinStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Save, Lock, Trash2 } from "lucide-react";
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
  const { postalCode, city, setLocation, setPostalCode } = useSettingsStore();
  const { currentUser } = useAppStore();
  const { hasPin, setPin, removePin } = usePinStore();

  const [postalInput, setPostalInput] = useState(postalCode);
  const [cityInput, setCityInput] = useState(city);

  // PIN state
  const currentHasPin = currentUser ? hasPin(currentUser.id) : false;
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

  const detected = detectLocation(postalInput);

  const handleSave = () => {
    const country = detected?.country ?? "ES";
    const region = detected?.region ?? "ES-MD";
    setPostalCode(postalInput.trim());
    setLocation(country, region, cityInput);
    toast.success("Localización guardada", {
      description: `${cityInput || postalInput} — se mostrarán las fiestas locales en el calendario`,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Ajustes</h1>

      {/* Location card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Localización familiar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Introduce tu código postal para mostrar las fiestas nacionales y locales en el calendario.
          </p>

          {/* Postal code input */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Código postal</Label>
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                value={postalInput}
                onChange={(e) => setPostalInput(e.target.value)}
                placeholder="ej: 28001, 08001..."
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
                {detected ? detected.label : "Código postal no reconocido"}
              </div>
            )}
          </div>

          {/* City (optional) */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Ciudad <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="ej: Madrid, Barcelona..."
              className="max-w-xs"
            />
          </div>

          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-1.5" />
            Guardar localización
          </Button>
        </CardContent>
      </Card>

      {/* PIN card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            PIN de acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configura un PIN de 4 dígitos para proteger tu perfil en este dispositivo.
            Se pedirá al cambiar de usuario.
          </p>

          {currentHasPin ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                🔒 PIN activado
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (currentUser) {
                    removePin(currentUser.id);
                    toast.success("PIN eliminado");
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Eliminar PIN
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-w-xs">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Nuevo PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4 dígitos"
                  className="text-center text-lg tracking-[0.3em] font-bold"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Confirmar PIN</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Repite el PIN"
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
                    toast.success("PIN configurado");
                  }
                }}
              >
                <Lock className="w-4 h-4 mr-1.5" />
                Activar PIN
              </Button>
              {pinInput.length === 4 && pinConfirm.length === 4 && pinInput !== pinConfirm && (
                <p className="text-xs text-red-500">Los PINs no coinciden</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
