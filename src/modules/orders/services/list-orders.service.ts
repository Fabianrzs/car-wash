import type { Prisma } from "@/generated/prisma/client";
import type { ListOrdersQuery } from "@/modules/orders/validations/order.validation";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { orderRepository } from "@/modules/orders/repositories/order.repository";

interface ListOrdersServiceInput {
  tenantId: string;
  userId: string;
  query: ListOrdersQuery;
}

export async function listOrdersService({ tenantId, userId, query }: ListOrdersServiceInput) {
  const where: Prisma.ServiceOrderWhereInput = { tenantId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.orderNumber = { contains: query.search, mode: "insensitive" };
  }

  if (query.clientId) {
    where.clientId = query.clientId;
  }

  if (query.assignedToMe) {
    where.assignedToId = userId;
  }

  if (query.unassigned) {
    where.assignedToId = null;
    if (!query.status) where.status = "PENDING";
  }

  const [orders, total] = await Promise.all([
    orderRepository.findMany({
      where,
      include: orderRepository.listInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    orderRepository.count({ where }),
  ]);

  return {
    orders,
    total,
    pages: Math.ceil(total / ITEMS_PER_PAGE),
  };
}


