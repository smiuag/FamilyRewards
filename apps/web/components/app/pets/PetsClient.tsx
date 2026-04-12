"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store/useAppStore";
import { usePetStore } from "@/lib/store/usePetStore";
import {
  fetchFamilyPet,
  createFamilyPet,
  updateFamilyPet,
  choosePetSpecies,
  fetchAccessoryCatalog,
  fetchFamilyInventory,
  purchaseAccessory,
  equipAccessory,
  fetchCareLog,
  calculatePetMood,
  fetchMuseumPets,
  retirePetToMuseum,
} from "@/lib/api/pets";
import { PET_SPECIES_CONFIG, PET_STAGE_THRESHOLDS, PET_STAGE_ORDER, MUSEUM_CARE_THRESHOLD } from "@/lib/pet/constants";
import type { PetSpecies, PetMood, AccessorySlot } from "@/lib/types";
import { PetDisplay } from "./PetDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { PawPrint, Sparkles, ShoppingBag, Palette, Star, Building2 } from "lucide-react";
import { PetMuseum } from "./PetMuseum";
import { toast } from "sonner";

const MOOD_EMOJI: Record<PetMood, string> = { happy: "😊", neutral: "😐", sad: "😢" };
const SLOT_TABS: AccessorySlot[] = ["head", "body", "background"];

export default function PetsClient() {
  const t = useTranslations("pets");
  const tc = useTranslations("common");
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const { currentUser, users, taskInstances } = useAppStore();
  const {
    pet, accessories, inventory, careLog, museumPets,
    loadPet, loadAccessories, loadInventory, loadCareLog, loadMuseumPets,
    setPetSpecies, setPetName, setPetColors, setPetEyeStyle,
    equipAccessoryLocal, addToInventory,
  } = usePetStore();

  const [loading, setLoading] = useState(true);
  const [adoptName, setAdoptName] = useState("");
  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [activeSlotTab, setActiveSlotTab] = useState<AccessorySlot>("head");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [retiring, setRetiring] = useState(false);

  // Load everything on mount
  useEffect(() => {
    async function load() {
      try {
        const [petData, catalogData, invData, logData, museum] = await Promise.all([
          fetchFamilyPet(),
          fetchAccessoryCatalog(),
          fetchFamilyInventory(),
          fetchCareLog(30),
          currentUser ? fetchMuseumPets(currentUser.familyId) : [],
        ]);
        loadPet(petData);
        loadAccessories(catalogData);
        loadInventory(invData);
        loadCareLog(logData);
        loadMuseumPets(museum);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadPet, loadAccessories, loadInventory, loadCareLog]);

  const today = new Date().toISOString().split("T")[0];
  const mood: PetMood = pet && pet.stage !== "egg"
    ? calculatePetMood(taskInstances, today)
    : "neutral";

  // Progress calculations
  const nextStageIdx = pet ? PET_STAGE_ORDER.indexOf(pet.stage) + 1 : 0;
  const nextStage = nextStageIdx < PET_STAGE_ORDER.length ? PET_STAGE_ORDER[nextStageIdx] : null;
  const currentThreshold = pet ? PET_STAGE_THRESHOLDS[pet.stage] : 0;
  const nextThreshold = nextStage ? PET_STAGE_THRESHOLDS[nextStage] : 0;
  const progressRange = nextThreshold - currentThreshold;
  const progressValue = pet && progressRange > 0
    ? Math.min(((pet.carePoints - currentThreshold) / progressRange) * 100, 100)
    : 100;

  const ADOPT_COST = 50;
  const canAffordAdopt = (currentUser?.pointsBalance ?? 0) >= ADOPT_COST;

  // Adopt handler (costs 50 points)
  async function handleAdopt() {
    if (!currentUser || !adoptName.trim() || !canAffordAdopt) return;
    try {
      const newPet = await createFamilyPet(currentUser.familyId, adoptName.trim());

      // Deduct points
      const { createClient } = await import("@/lib/supabase/client");
      const { recordTransaction } = await import("@/lib/api/transactions");
      const supabase = createClient();
      const newBalance = currentUser.pointsBalance - ADOPT_COST;
      await supabase.from("profiles").update({ points_balance: newBalance }).eq("id", currentUser.id);
      await recordTransaction({
        profileId: currentUser.id,
        amount: -ADOPT_COST,
        type: "reward",
        description: `Mascota adoptada: ${adoptName.trim()}`,
        emoji: "🐾",
        balanceAfter: newBalance,
      }).catch(() => {});

      useAppStore.setState((s) => ({
        currentUser: s.currentUser ? { ...s.currentUser, pointsBalance: newBalance } : null,
        users: s.users.map((u) => u.id === currentUser.id ? { ...u, pointsBalance: newBalance } : u),
      }));

      loadPet(newPet);
      toast.success(t("adoptCta"));
    } catch {
      toast.error("Error");
    }
  }

  // Species selection
  async function handleChooseSpecies(species: PetSpecies) {
    if (!pet) return;
    const cfg = PET_SPECIES_CONFIG[species];
    try {
      await choosePetSpecies(pet.id, species, cfg.defaultPrimary, cfg.defaultSecondary);
      setPetSpecies(species, cfg.defaultPrimary, cfg.defaultSecondary);
      setShowSpeciesPicker(false);
      toast.success(`${cfg.emoji} ${locale === "en" ? cfg.labelEn : cfg.label}`);
    } catch {
      toast.error("Error");
    }
  }

  // Purchase accessory
  async function handlePurchase(accessoryId: string) {
    if (!pet || !currentUser) return;
    const acc = accessories.find((a) => a.id === accessoryId);
    if (!acc) return;
    if (currentUser.pointsBalance < acc.pointsCost) {
      toast.error(t("notEnoughPoints"));
      return;
    }
    setPurchasing(accessoryId);
    try {
      const item = await purchaseAccessory(
        accessoryId, currentUser.familyId, currentUser.id,
        acc.pointsCost, currentUser.pointsBalance,
        locale === "en" ? acc.nameEn : acc.name, acc.emoji
      );
      addToInventory(item);
      useAppStore.setState((s) => ({
        currentUser: s.currentUser
          ? { ...s.currentUser, pointsBalance: s.currentUser.pointsBalance - acc.pointsCost }
          : null,
        users: s.users.map((u) =>
          u.id === currentUser.id
            ? { ...u, pointsBalance: u.pointsBalance - acc.pointsCost }
            : u
        ),
      }));
      toast.success(t("purchaseSuccess"));
    } catch {
      toast.error("Error");
    } finally {
      setPurchasing(null);
    }
  }

  // Equip/unequip
  async function handleEquip(slot: AccessorySlot, accessoryId: string | null) {
    if (!pet) return;
    try {
      await equipAccessory(pet.id, slot, accessoryId, pet.activeAccessories);
      equipAccessoryLocal(slot, accessoryId);
      toast.success(t("equipSuccess"));
    } catch {
      toast.error("Error");
    }
  }

  // Color change
  async function handleColorChange(field: "primaryColor" | "secondaryColor", value: string) {
    if (!pet) return;
    if (field === "primaryColor") {
      setPetColors(value, pet.secondaryColor);
      await updateFamilyPet(pet.id, { primaryColor: value }).catch(() => {});
    } else {
      setPetColors(pet.primaryColor, value);
      await updateFamilyPet(pet.id, { secondaryColor: value }).catch(() => {});
    }
  }

  // Eye style change
  async function handleEyeChange(style: string) {
    if (!pet) return;
    setPetEyeStyle(style);
    await updateFamilyPet(pet.id, { eyeStyle: style }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── No pet yet: Adoption wizard ──────────────────────────
  if (!pet) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
            <PawPrint className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t("adoptCta")}</h1>
          <p className="text-muted-foreground mt-2">{t("adoptDesc")}</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label htmlFor="pet-name" className="text-sm font-medium">{t("namePet")}</label>
              <input
                id="pet-name"
                type="text"
                value={adoptName}
                onChange={(e) => setAdoptName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                maxLength={30}
              />
            </div>
            <Button
              onClick={handleAdopt}
              disabled={!adoptName.trim() || !canAffordAdopt}
              className="w-full"
            >
              <Star className="w-4 h-4 mr-1" />
              {t("adoptButton")} — {ADOPT_COST} {tc("pts")}
            </Button>
            {!canAffordAdopt && (
              <p className="text-xs text-destructive text-center">{t("notEnoughPoints")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stageKey = `stage${pet.stage.charAt(0).toUpperCase()}${pet.stage.slice(1)}` as
    "stageEgg" | "stageBaby" | "stageJuvenile" | "stageAdult";

  const ownedIds = new Set(inventory.map((i) => i.accessoryId));
  const slotAccessories = accessories.filter((a) => a.slot === activeSlotTab);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-8">
      {/* ── Pet Viewport ──────────────────────────────────── */}
      <div className="flex flex-col items-center text-center pt-4">
        <PetDisplay
          pet={pet}
          mood={mood}
          size="lg"
          inventory={inventory}
          accessories={accessories}
        />
        <h1 className="text-xl font-bold mt-4">{pet.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline">{t(stageKey)}</Badge>
          {pet.stage !== "egg" && (
            <span className="text-sm">{MOOD_EMOJI[mood]} {t(`mood${mood.charAt(0).toUpperCase()}${mood.slice(1)}` as "moodHappy" | "moodNeutral" | "moodSad")}</span>
          )}
        </div>

        {/* Progress bar */}
        {nextStage && (
          <div className="w-full max-w-xs mt-4">
            <Progress value={progressValue} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {t("careProgress", {
                current: pet.carePoints - currentThreshold,
                needed: progressRange,
              })}
            </p>
          </div>
        )}

        {/* Choose species button (only if egg and no species) */}
        {pet.stage === "egg" && !pet.species && (
          <Button onClick={() => setShowSpeciesPicker(true)} className="mt-4">
            <Sparkles className="w-4 h-4 mr-2" />
            {t("chooseSpecies")}
          </Button>
        )}
      </div>

      {/* ── Customize (only when hatched) ─────────────────── */}
      {pet.stage !== "egg" && pet.species && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              {t("customize")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">{t("primaryColor")}</label>
                <input
                  type="color"
                  value={pet.primaryColor}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg cursor-pointer border border-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("secondaryColor")}</label>
                <input
                  type="color"
                  value={pet.secondaryColor}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg cursor-pointer border border-input"
                />
              </div>
            </div>

            {/* Eye style selector */}
            <div>
              <label className="text-xs text-muted-foreground">{t("eyeStyle")}</label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {["happy", "sad", "sleepy", "excited", "surprised", "love", "angry", "cool"].map((style) => (
                  <button
                    key={style}
                    onClick={() => handleEyeChange(style)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      pet.eyeStyle === style
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:border-primary/50"
                    }`}
                  >
                    {style === "happy" ? "😊" :
                     style === "sad" ? "😢" :
                     style === "sleepy" ? "😴" :
                     style === "excited" ? "🤩" :
                     style === "surprised" ? "😲" :
                     style === "love" ? "😍" :
                     style === "angry" ? "😠" :
                     "😎"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Accessory Shop ────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            {t("shop")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pet.stage === "egg" ? (
            /* Locked state — egg hasn't hatched yet */
            <div className="flex flex-col items-center text-center py-8 px-4 gap-3">
              <div className="inline-flex p-3 rounded-full bg-muted">
                <ShoppingBag className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t("shopLockedTitle")}</p>
              <p className="text-xs text-muted-foreground max-w-xs">{t("shopLockedDesc")}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={progressValue} className="h-2 w-32" />
                <span className="text-xs text-muted-foreground font-medium">
                  {pet.carePoints}/{nextThreshold}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Slot tabs */}
              <div className="flex gap-2 mb-4">
                {SLOT_TABS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setActiveSlotTab(slot)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSlotTab === slot
                        ? "bg-primary text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {t(`slot${slot.charAt(0).toUpperCase()}${slot.slice(1)}` as "slotHead" | "slotBody" | "slotBackground")}
                  </button>
                ))}
              </div>

              {/* Accessory grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slotAccessories.map((acc) => {
                  const owned = ownedIds.has(acc.id);
                  const equipped = pet.activeAccessories[acc.slot] === acc.id;
                  const canAfford = (currentUser?.pointsBalance ?? 0) >= acc.pointsCost;

                  return (
                    <div
                      key={acc.id}
                      className={`rounded-xl border p-3 text-center space-y-2 ${
                        equipped ? "border-primary bg-primary/5" : "border-input"
                      }`}
                    >
                      <div className="text-2xl">{acc.emoji}</div>
                      <p className="text-sm font-medium truncate">{locale === "en" ? acc.nameEn : acc.name}</p>

                      {!owned ? (
                        <Button
                          size="sm"
                          variant={canAfford ? "default" : "outline"}
                          disabled={!canAfford || purchasing === acc.id}
                          onClick={() => handlePurchase(acc.id)}
                          className="w-full text-xs"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {acc.pointsCost} {t("buy")}
                        </Button>
                      ) : equipped ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEquip(acc.slot, null)}
                          className="w-full text-xs"
                        >
                          {t("unequip")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEquip(acc.slot, acc.id)}
                          className="w-full text-xs"
                        >
                          {t("equip")}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Care History ──────────────────────────────────── */}
      {careLog.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-primary" />
              {t("careHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {careLog.slice(0, 15).map((entry) => {
                const user = users.find((u) => u.id === entry.profileId);
                return (
                  <div key={entry.id} className="flex items-center gap-2 text-sm">
                    <span>{user?.avatar ?? "👤"}</span>
                    <span className="text-muted-foreground">
                      {t("careContribution", {
                        name: user?.name ?? "?",
                        points: entry.amount,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Species Picker Modal ──────────────────────────── */}
      <AppModal open={showSpeciesPicker} onOpenChange={setShowSpeciesPicker}>
        <AppModalHeader
          emoji="🥚"
          title={t("chooseSpecies")}
          onClose={() => setShowSpeciesPicker(false)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground mb-4">{t("chooseSpeciesDesc")}</p>
          <div className="grid grid-cols-1 gap-3">
            {(Object.entries(PET_SPECIES_CONFIG) as [PetSpecies, typeof PET_SPECIES_CONFIG.fire][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleChooseSpecies(key)}
                  className="flex items-center gap-4 rounded-xl border border-input p-4 hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: cfg.defaultPrimary + "20" }}
                  >
                    {cfg.emoji}
                  </div>
                  <div>
                    <p className="font-semibold">{locale === "en" ? cfg.labelEn : cfg.label}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: cfg.defaultPrimary }} />
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: cfg.defaultSecondary }} />
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setShowSpeciesPicker(false)}>
            {tc("cancel")}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Retire to museum button (admin only, adult with enough care points) */}
      {pet && currentUser?.role === "admin" && pet.stage === "adult" && pet.carePoints >= MUSEUM_CARE_THRESHOLD && (
        <Card className="shadow-sm border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-bold text-sm">{t("readyForMuseum")}</p>
                  <p className="text-xs text-muted-foreground">{t("retireDescription")}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => setShowRetireConfirm(true)}
              >
                {t("retirePet")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retire confirmation modal */}
      <AppModal open={showRetireConfirm} onOpenChange={setShowRetireConfirm}>
        <AppModalHeader
          emoji="🏛️"
          title={t("retirePet")}
          description={t("retireConfirmDesc")}
          color="bg-gradient-to-r from-amber-500 to-yellow-400"
          onClose={() => setShowRetireConfirm(false)}
        />
        <AppModalBody>
          <p className="text-sm text-muted-foreground">{t("retireConfirmBody")}</p>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setShowRetireConfirm(false)}>
            {tc("cancel")}
          </Button>
          <Button
            disabled={retiring}
            onClick={async () => {
              if (!pet || !currentUser) return;
              setRetiring(true);
              try {
                await retirePetToMuseum(pet.id, currentUser.familyId);
                loadPet(null);
                loadInventory([]);
                const museum = await fetchMuseumPets(currentUser.familyId);
                loadMuseumPets(museum);
                useAppStore.setState((s) => ({
                  featuresUnlocked: s.featuresUnlocked.filter((f) => f !== "pets"),
                }));
                toast.success(t("petRetired"));
              } catch {
                toast.error(tc("error"));
              } finally {
                setRetiring(false);
                setShowRetireConfirm(false);
              }
            }}
          >
            {retiring ? "..." : t("retireConfirm")}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* Museum section */}
      {museumPets.length > 0 && <PetMuseum pets={museumPets} />}
    </div>
  );
}
