"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAppStore } from "@/lib/store/useAppStore";
import type { RewardClaim } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, Gift, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/types";

export default function RewardsClient() {
  const t = useTranslations("rewards");
  const { currentUser, rewards, claims, addClaim } = useAppStore();
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);

  if (!currentUser) return null;

  const userClaims = claims.filter((c) => c.userId === currentUser.id);

  const getClaimForReward = (rewardId: string) =>
    userClaims.filter((c) => c.rewardId === rewardId).at(-1);

  const handleRedeem = () => {
    if (!confirmReward) return;
    const newClaim: RewardClaim = {
      id: `c-${Date.now()}`,
      rewardId: confirmReward.id,
      userId: currentUser.id,
      requestedAt: new Date().toISOString(),
      status: "pending",
    };
    addClaim(newClaim);
    setConfirmReward(null);
    toast.success("Solicitud enviada", {
      description: "Un administrador revisará tu solicitud pronto.",
    });
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

      {/* Rewards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const canAfford = currentUser.pointsBalance >= reward.pointsCost;
          const claim = getClaimForReward(reward.id);
          const hasPendingClaim = claim?.status === "pending";
          const isApproved = claim?.status === "approved";

          return (
            <Card
              key={reward.id}
              className={cn(
                "shadow-sm transition-all hover:shadow-md",
                !canAfford && "opacity-75",
                isApproved && "border-green-300 bg-green-50"
              )}
            >
              <CardContent className="pt-5">
                {/* Emoji */}
                <div className="text-5xl mb-3">{reward.emoji}</div>

                {/* Title & description */}
                <h3 className="font-bold text-foreground mb-1">{reward.title}</h3>
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
                </div>

                {/* Claim status or button */}
                {isApproved ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    {t("status.approved")}
                  </div>
                ) : hasPendingClaim ? (
                  <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
                    <Clock className="w-4 h-4" />
                    {t("status.pending")}
                  </div>
                ) : claim?.status === "rejected" ? (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <XCircle className="w-4 h-4" />
                    {t("status.rejected")}
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
        })}
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-3xl">{confirmReward?.emoji}</span>
              Canjear recompensa
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-muted-foreground">
              ¿Seguro que quieres solicitar{" "}
              <span className="font-semibold text-foreground">
                {confirmReward?.title}
              </span>{" "}
              por{" "}
              <span className="font-semibold text-primary">
                {confirmReward?.pointsCost.toLocaleString()} puntos
              </span>
              ?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Un administrador revisará y aprobará tu solicitud.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReward(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRedeem}>
              <Gift className="w-4 h-4 mr-1.5" />
              Confirmar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
