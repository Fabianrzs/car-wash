import { CommissionModuleError } from "@/modules/commissions/commission.errors";
import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

interface CreatePayoutServiceInput {
  tenantId: string;
  userId: string;
  earningIds: string[];
  notes?: string;
  paidById: string;
}

export async function createPayoutService({
  tenantId,
  userId,
  earningIds,
  notes,
  paidById,
}: CreatePayoutServiceInput) {
  const earnings = await commissionRepository.findManyEarnings({
    where: { id: { in: earningIds }, tenantId, userId },
    select: { id: true, status: true, amount: true },
  });

  if (earnings.length !== earningIds.length) {
    throw new CommissionModuleError("Una o más ganancias no son válidas", 400);
  }

  const nonPending = earnings.filter((e) => e.status !== "PENDING");
  if (nonPending.length > 0) {
    throw new CommissionModuleError("Solo se pueden pagar ganancias pendientes", 400);
  }

  const totalAmount = earnings.reduce(
    (sum, e) => sum + e.amount.toNumber(),
    0
  );

  return commissionRepository.transaction(async (tx) => {
    const payout = await commissionRepository.createPayout({
      data: {
        tenantId,
        userId,
        totalAmount: totalAmount.toFixed(2),
        notes: notes ?? null,
        paidById,
      },
    }, tx);

    await commissionRepository.updateManyEarnings({
      where: { id: { in: earningIds } },
      data: { status: "PAID", payoutId: payout.id },
    }, tx);

    return payout;
  });
}
