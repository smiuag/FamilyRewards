"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FamilyPet,
  PetAccessory,
  PetInventoryItem,
  PetCareLogEntry,
  PetSpecies,
  PetStage,
  PetMood,
  AccessorySlot,
} from "@/lib/types";
import { getStageForCarePoints } from "@/lib/pet/constants";

interface PetState {
  pet: FamilyPet | null;
  accessories: PetAccessory[];
  inventory: PetInventoryItem[];
  careLog: PetCareLogEntry[];
  museumPets: FamilyPet[];

  // Loaders
  loadPet: (pet: FamilyPet | null) => void;
  loadAccessories: (items: PetAccessory[]) => void;
  loadInventory: (items: PetInventoryItem[]) => void;
  loadCareLog: (entries: PetCareLogEntry[]) => void;
  loadMuseumPets: (pets: FamilyPet[]) => void;

  // Optimistic updates
  setPetSpecies: (species: PetSpecies, primary: string, secondary: string) => void;
  setPetName: (name: string) => void;
  setPetColors: (primary: string, secondary: string) => void;
  setPetEyeStyle: (style: string) => void;
  addCarePointsLocal: (amount: number) => void;
  equipAccessoryLocal: (slot: AccessorySlot, accessoryId: string | null) => void;
  addToInventory: (item: PetInventoryItem) => void;
  updateMood: (mood: PetMood) => void;
  updateStage: (stage: PetStage) => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set) => ({
      pet: null,
      accessories: [],
      inventory: [],
      careLog: [],
      museumPets: [],

      loadPet: (pet) => set({ pet }),

      loadAccessories: (accessories) => set({ accessories }),

      loadInventory: (inventory) => set({ inventory }),

      loadMuseumPets: (museumPets) => set({ museumPets }),

      loadCareLog: (careLog) => set({ careLog }),

      setPetSpecies: (species, primary, secondary) =>
        set((s) => ({
          pet: s.pet
            ? { ...s.pet, species, primaryColor: primary, secondaryColor: secondary }
            : null,
        })),

      setPetName: (name) =>
        set((s) => ({
          pet: s.pet ? { ...s.pet, name } : null,
        })),

      setPetColors: (primary, secondary) =>
        set((s) => ({
          pet: s.pet
            ? { ...s.pet, primaryColor: primary, secondaryColor: secondary }
            : null,
        })),

      setPetEyeStyle: (style) =>
        set((s) => ({
          pet: s.pet ? { ...s.pet, eyeStyle: style } : null,
        })),

      addCarePointsLocal: (amount) =>
        set((s) => {
          if (!s.pet) return {};
          const newPoints = Math.max(0, s.pet.carePoints + amount);
          const newStage = getStageForCarePoints(newPoints);
          return {
            pet: {
              ...s.pet,
              carePoints: newPoints,
              stage: newStage,
              hatchedAt:
                newStage === "baby" && s.pet.stage === "egg"
                  ? new Date().toISOString()
                  : s.pet.hatchedAt,
            },
          };
        }),

      equipAccessoryLocal: (slot, accessoryId) =>
        set((s) => ({
          pet: s.pet
            ? {
                ...s.pet,
                activeAccessories: { ...s.pet.activeAccessories, [slot]: accessoryId },
              }
            : null,
        })),

      addToInventory: (item) =>
        set((s) => ({ inventory: [item, ...s.inventory] })),

      updateMood: (_mood) =>
        set((s) => ({
          // mood is calculated client-side, stored transiently on pet for display
          pet: s.pet ? { ...s.pet } : null,
        })),

      updateStage: (stage) =>
        set((s) => ({
          pet: s.pet ? { ...s.pet, stage } : null,
        })),
    }),
    {
      name: "family-rewards-pet-store",
      partialize: (state) => ({
        // Only persist the pet object for dashboard card display between navigations
        pet: state.pet,
      }),
    }
  )
);
