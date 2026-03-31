import { commissionRepository } from "@/modules/commissions/repositories/commission.repository";

interface ListPayoutsServiceInput {
  tenantId: string;
  userId?: string;
}

export async function listPayoutsService({ tenantId, userId }: ListPayoutsServiceInput) {
  return commissionRepository.findManyPayouts({
    where: {
      tenantId,
      ...(userId ? { userId } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      paidBy: { select: { id: true, name: true } },
      earnings: { select: { id: true, amount: true, order: { select: { orderNumber: true } } } },
    },
    orderBy: { paidAt: "desc" },
  });
}
