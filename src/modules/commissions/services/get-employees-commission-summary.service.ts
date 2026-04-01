import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

export interface EmployeeCommissionSummary {
  userId: string;
  name: string | null;
  email: string;
  pendingTotal: number;
  pendingCount: number;
}

export async function getEmployeesCommissionSummaryService(
  tenantId: string
): Promise<EmployeeCommissionSummary[]> {
  const grouped = await commissionRepository.groupEarningsByUser(tenantId, "PENDING");

  if (grouped.length === 0) return [];

  const userIds = grouped.map((g) => g.userId);
  const users = await commissionRepository.findUsersByIds(userIds);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return grouped
    .map((g) => ({
      userId: g.userId,
      name: userMap.get(g.userId)?.name ?? null,
      email: userMap.get(g.userId)?.email ?? "",
      pendingTotal: g._sum.amount?.toNumber() ?? 0,
      pendingCount: g._count.id,
    }))
    .sort((a, b) => b.pendingTotal - a.pendingTotal);
}
