/**
 * Fire-and-forget care point update for the family pet.
 * Called from any code path that completes a task (updateTaskInstance, claimTask, backfill).
 */
export function notifyPetCarePoints(
  profileId: string,
  familyId: string,
  delta: number
): void {
  if (delta === 0) return;

  import("@/lib/store/usePetStore").then(({ usePetStore }) => {
    const petState = usePetStore.getState();
    if (!petState.pet) return;

    petState.addCarePointsLocal(delta);

    import("@/lib/api/pets").then(({ addCarePoints }) => {
      addCarePoints(
        petState.pet!.id,
        profileId,
        familyId,
        delta,
        petState.pet!.carePoints
      ).catch(() => {});
    });
  });
}
