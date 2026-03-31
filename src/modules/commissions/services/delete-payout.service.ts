import { CommissionModuleError } from "@/modules/commissions/commission.errors";
import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

export async function deletePayoutService({
  tenantId,
  payoutId,
}: {
  tenantId: string;
  payoutId: string;
}) {
  const payout = await commissionRepository.findPayoutFirst({
    where: { id: payoutId, tenantId },
    select: { id: true, earnings: { select: { id: true } } },
  });

  if (!payout) {
    throw new CommissionModuleError("Pago no encontrado", 404);
  }

  const earningIds = payout.earnings.map((e) => e.id);

  await commissionRepository.transaction(async (tx) => {
    if (earningIds.length > 0) {
      await commissionRepository.updateManyEarnings(
        {
          where: { id: { in: earningIds } },
          data: { status: "PENDING", payoutId: null },
        },
        tx
      );
    }
    await commissionRepository.deletePayout({ where: { id: payoutId } }, tx);
  });
}
