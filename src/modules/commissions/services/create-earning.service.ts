import type { Prisma } from "@/generated/prisma/client";
import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

interface CreateEarningServiceInput {
  tenantId: string;
  orderId: string;
  userId: string;
  orderTotal: Prisma.Decimal;
}

export async function createEarningService({
  tenantId,
  orderId,
  userId,
  orderTotal,
}: CreateEarningServiceInput) {
  const tenant = await commissionRepository.findTenantFirst({
    where: { id: tenantId },
    select: { commissionRate: true },
  });

  if (!tenant) return;

  const rate = tenant.commissionRate.toNumber();
  if (rate === 0) return;

  const amount = (orderTotal.toNumber() * (rate / 100)).toFixed(2);

  await commissionRepository.createEarning({
    data: {
      tenantId,
      orderId,
      userId,
      amount,
      commissionRate: tenant.commissionRate,
    },
  });
}
