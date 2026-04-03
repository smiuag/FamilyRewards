"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { MOCK_REWARDS, MOCK_USERS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Star, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AdminRewardsClient() {
  const { claims, updateClaim } = useAppStore();

  const pendingClaims = claims.filter((c) => c.status === "pending");

  const getReward = (id: string) => MOCK_REWARDS.find((r) => r.id === id);
  const getUser = (id: string) => MOCK_USERS.find((u) => u.id === id);

  const handleApprove = (claimId: string) => {
    updateClaim(claimId, "approved");
    toast.success("Solicitud aprobada");
  };

  const handleReject = (claimId: string) => {
    updateClaim(claimId, "rejected");
    toast.error("Solicitud rechazada");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Gestión de Recompensas</h1>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva recompensa
        </Button>
      </div>

      {/* Pending claims */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Solicitudes pendientes
            {pendingClaims.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0">
                {pendingClaims.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={pendingClaims.length === 0 ? "pb-5" : "p-0"}>
          {pendingClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No hay solicitudes pendientes 🎉
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recompensa</TableHead>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Coste</TableHead>
                  <TableHead>Solicitada</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingClaims.map((claim) => {
                  const reward = getReward(claim.rewardId);
                  const user = getUser(claim.userId);
                  return (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{reward?.emoji}</span>
                          <span className="font-medium">{reward?.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{user?.avatar}</span>
                          <span className="font-medium">{user?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                          <span className="font-bold text-primary">
                            {reward?.pointsCost.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(claim.requestedAt), "d MMM, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="h-8 bg-green-500 hover:bg-green-600 text-white text-xs"
                            onClick={() => handleApprove(claim.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-500 border-red-200 hover:bg-red-50 text-xs"
                            onClick={() => handleReject(claim.id)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rewards catalog */}
      <div>
        <h2 className="text-base font-semibold mb-3">Catálogo de recompensas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_REWARDS.map((reward) => (
            <Card key={reward.id} className="shadow-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{reward.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{reward.title}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs font-bold text-primary">
                        {reward.pointsCost.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
