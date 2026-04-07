"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import type { RewardClaim } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from "@/components/ui/app-modal";
import { Star, Gift, Clock, CheckCircle2, XCircle, Target, Archive, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/types";

export default function RewardsClient() {
  const t = useTranslations("rewards");
  const { currentUser, rewards, claims, addClaim, updateClaim, targetRewardIds, toggleTargetReward, archivedClaimIds, archiveClaim } = useAppStore();
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (!currentUser) return null;

  const userClaims = claims.filter((c) => c.userId === currentUser.id);

  const getClaimForReward = (rewardId: string) =>
    userClaims.filter((c) => c.rewardId === rewardId).at(-1);

  const handleRedeem = () => {
    if (!confirmReward) return;
    const isAdmin = currentUser.role === "admin";
    const claimId = `c-${Date.now()}`;
    const newClaim: RewardClaim = {
      id: claimId,
      rewardId: confirmReward.id,
      userId: currentUser.id,
      requestedAt: new Date().toISOString(),
      status: isAdmin ? "approved" : "pending",
    };
    addClaim(newClaim);
    setConfirmReward(null);
    if (isAdmin) {
      toast.success(`¡${confirmReward.emoji} ${confirmReward.title} canjeada!`, {
        description: "Como administrador, el canje se ha aplicado directamente.",
      });
    } else {
      toast.success("Solicitud enviada", {
        description: "Un administrador revisará tu solicitud pronto.",
      });
    }
  };

  const targetRewards = rewards.filter((r) => targetRewardIds.includes(r.id));
  const otherRewards = rewards.filter((r) => !targetRewardIds.includes(r.id));

  const RewardCard = ({ reward }: { reward: Reward }) => {
    const canAfford = currentUser.pointsBalance >= reward.pointsCost;
    const claim = getClaimForReward(reward.id);
    const hasPendingClaim = claim?.status === "pending";
    const isApproved = claim?.status === "approved";
    const isRejected = claim?.status === "rejected";
    const isResolved = (isApproved || isRejected) && !!claim;
    const isArchived = isResolved && archivedClaimIds.includes(claim!.id);
    const isTarget = targetRewardIds.includes(reward.id);

    if (isArchived) return null;

    return (
      <Card
        className={cn(
          "shadow-sm transition-all hover:shadow-md relative",
          !canAfford && "opacity-75",
          isApproved && "border-green-300 bg-green-50",
          isTarget && !isApproved && "border-primary/40"
        )}
      >
        <CardContent className="pt-5">
          {/* Target toggle */}
          <button
            onClick={() => toggleTargetReward(reward.id)}
            className={cn(
              "absolute top-3 right-3 p-1 rounded-lg transition-all",
              isTarget
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/40 hover:text-primary/60 hover:bg-primary/5"
            )}
            title={isTarget ? "Quitar de objetivos" : "Marcar como objetivo"}
          >
            <Target className="w-4 h-4" />
          </button>

          {/* Emoji */}
          <div className="text-5xl mb-3">{reward.emoji}</div>

          {/* Title & description */}
          <h3 className="font-bold text-foreground mb-1 pr-7">{reward.title}</h3>
          {reward.description && (
            <p className="text-xs text-muted-foreground mb-3">
              {reward.description}
            </p>
          )}

          {/* Cost */}
          <div className="flex items-center gap-1 mb-4">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="font-bold text-primary">
              {reward.pointsCost.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">pts</span>
            {canAfford && !hasPendingClaim && !isApproved && (
              <span className="ml-auto text-xs text-green-600 font-medium">¡Puedes canjearlo!</span>
            )}
          </div>

          {/* Claim status or button */}
          {isApproved ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {t("status.approved")}
              </div>
              <button onClick={() => archiveClaim(claim!.id)}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="Archivar">
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : hasPendingClaim ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
              <Clock className="w-4 h-4" />
              {t("status.pending")}
            </div>
          ) : isRejected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <XCircle className="w-4 h-4" />
                {t("status.rejected")}
              </div>
              <button onClick={() => archiveClaim(claim!.id)}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="Archivar">
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              disabled={!canAfford || reward.status === "disabled"}
              onClick={() => setConfirmReward(reward)}
            >
              <Gift className="w-3.5 h-3.5 mr-1.5" />
              {canAfford ? t("redeem") : t("notEnoughPoints")}
            </Button>
          )}

          {!canAfford && !hasPendingClaim && !isApproved && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Te faltan{" "}
              <span className="text-primary font-semibold">
                {(reward.pointsCost - currentUser.pointsBalance).toLocaleString()} pts
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with points */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <Star className="w-4 h-4 fill-primary" />
          <span className="font-bold text-lg">
            {currentUser.pointsBalance.toLocaleString()}
          </span>
          <span className="text-sm font-medium">{t("myPoints")}</span>
        </div>
      </div>

      {/* Target rewards section */}
      {targetRewards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-base">Mis objetivos</h2>
            <Badge variant="secondary" className="text-xs">{targetRewards.length}</Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}

      {/* All rewards */}
      <div>
        {targetRewards.length > 0 && (
          <h2 className="font-semibold text-base mb-3">Todas las recompensas</h2>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(targetRewards.length > 0 ? otherRewards : rewards).map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
        {targetRewards.length > 0 && otherRewards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Todas las recompensas están marcadas como objetivo
          </p>
        )}
      </div>

      {/* Archived claims */}
      {(() => {
        const archived = userClaims
          .filter((c) => archivedClaimIds.includes(c.id) && (c.status === "approved" || c.status === "rejected"))
          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
        if (archived.length === 0) return null;
        return (
          <div>
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <Archive className="w-4 h-4" />
              Archivo ({archived.length})
              <ChevronDown className={cn("w-4 h-4 transition-transform", archiveOpen && "rotate-180")} />
            </button>
            {archiveOpen && (
              <div className="space-y-2">
                {archived.map((claim) => {
                  const reward = rewards.find((r) => r.id === claim.rewardId);
                  return (
                    <div key={claim.id} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5 text-sm">
                      <span className="text-xl">{reward?.emoji}</span>
                      <span className="flex-1 font-medium text-muted-foreground">{reward?.title}</span>
                      <span className={cn(
                        "text-xs font-semibold",
                        claim.status === "approved" ? "text-green-600" : "text-red-500"
                      )}>
                        {claim.status === "approved" ? "Aprobada" : "Rechazada"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(claim.requestedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Confirm modal */}
      <AppModal open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <AppModalHeader
          emoji={confirmReward?.emoji}
          title="Canjear recompensa"
          description={confirmReward?.title}
          color="bg-gradient-to-br from-amber-400 to-orange-500"
          onClose={() => setConfirmReward(null)}
        />
        <AppModalBody>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vas a solicitar esta recompensa por{" "}
            <span className="font-bold text-primary text-base">
              {confirmReward?.pointsCost.toLocaleString()} pts
            </span>
            . Un administrador revisará y aprobará tu solicitud.
          </p>
          <div className="flex items-center justify-between bg-muted rounded-xl p-3">
            <span className="text-sm text-muted-foreground">Tu saldo actual</span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              {currentUser?.pointsBalance.toLocaleString()} pts
            </span>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button variant="outline" onClick={() => setConfirmReward(null)}>Cancelar</Button>
          <Button onClick={handleRedeem}>
            <Gift className="w-4 h-4 mr-1.5" />
            Confirmar solicitud
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
