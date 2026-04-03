"use client";

import { useState } from "react";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { COUNTRIES, REGIONS } from "@/lib/holidays";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Globe, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsClient() {
  const { country, region, city, setLocation } = useSettingsStore();

  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [cityInput, setCityInput] = useState(city);

  const availableRegions = REGIONS.filter((r) => r.country === selectedCountry);

  const handleSave = () => {
    setLocation(selectedCountry, selectedRegion, cityInput);
    toast.success("Localización guardada", {
      description: `${cityInput} — se mostrarán las fiestas locales en el calendario`,
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
            Configura la ubicación para mostrar las fiestas nacionales y locales en el calendario.
          </p>

          {/* Country */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">País</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setSelectedCountry(c.code);
                    const firstRegion = REGIONS.find((r) => r.country === c.code);
                    if (firstRegion) setSelectedRegion(firstRegion.code);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-all",
                    selectedCountry === c.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-xs">{c.name}</span>
                  {selectedCountry === c.code && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          {availableRegions.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Comunidad / Región
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableRegions.map((r) => (
                  <button
                    key={r.code}
                    onClick={() => setSelectedRegion(r.code)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all",
                      selectedRegion === r.code
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              <Globe className="w-3.5 h-3.5 inline mr-1" />
              Ciudad (opcional)
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

      {/* Preview of what will show */}
      <Card className="shadow-sm bg-blue-50 border-blue-200">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <p className="font-semibold text-blue-800 text-sm">
                Fiestas locales en el calendario
              </p>
              <p className="text-blue-600 text-xs mt-0.5">
                Los días festivos aparecerán marcados en el calendario con su nombre e icono. Podrás configurar si esos días las tareas recurrentes se omiten automáticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
