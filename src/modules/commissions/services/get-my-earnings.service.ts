import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

interface GetMyEarningsServiceInput {
  tenantId: string;
  userId: string;
}

export async function getMyEarningsService({
  tenantId,
  userId,
}: GetMyEarningsServiceInput) {
  const earnings = await commissionRepository.findManyEarnings({
    where: { tenantId, userId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          completedAt: true,
        },
      },
      payout: { select: { id: true, paidAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [pendingAgg, totalAgg] = await Promise.all([
    commissionRepository.aggregateEarnings({
      where: { tenantId, userId, status: "PENDING" },
      _sum: { amount: true },
    }),
    commissionRepository.aggregateEarnings({
      where: { tenantId, userId },
      _sum: { amount: true },
    }),
  ]);

  return {
    earnings,
    pendingTotal: pendingAgg._sum.amount?.toNumber() ?? 0,
    totalEarned: totalAgg._sum.amount?.toNumber() ?? 0,
  };
}
