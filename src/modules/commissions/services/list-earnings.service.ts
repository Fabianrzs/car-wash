import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

interface ListEarningsServiceInput {
  tenantId: string;
  userId?: string;
  status?: "PENDING" | "PAID";
}

export async function listEarningsService({
  tenantId,
  userId,
  status,
}: ListEarningsServiceInput) {
  const earnings = await commissionRepository.findManyEarnings({
    where: {
      tenantId,
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
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

  const pendingTotal = await commissionRepository.aggregateEarnings({
    where: {
      tenantId,
      ...(userId ? { userId } : {}),
      status: "PENDING",
    },
    _sum: { amount: true },
  });

  return {
    earnings,
    pendingTotal: pendingTotal._sum.amount?.toNumber() ?? 0,
  };
}
