import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

export async function getCommissionStatsService(tenantId: string) {
  const [pendingAgg, paidAgg, tenant] = await Promise.all([
    commissionRepository.aggregateEarnings({
      where: { tenantId, status: "PENDING" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    commissionRepository.aggregateEarnings({
      where: { tenantId, status: "PAID" },
      _sum: { amount: true },
    }),
    commissionRepository.findTenantFirst({
      where: { id: tenantId },
      select: { commissionRate: true },
    }),
  ]);

  const totalPending = pendingAgg._sum.amount?.toNumber() ?? 0;
  const totalPaid = paidAgg._sum.amount?.toNumber() ?? 0;

  return {
    totalPending,
    totalPaid,
    pendingCount: pendingAgg._count.id,
    commissionRate: tenant?.commissionRate.toNumber() ?? 0,
  };
}
