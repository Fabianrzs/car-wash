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
    const s = query.search.trim();
    where.OR = [
      { orderNumber: { contains: s, mode: "insensitive" } },
      { vehicle: { plate: { contains: s, mode: "insensitive" } } },
      { client: { firstName: { contains: s, mode: "insensitive" } } },
      { client: { lastName: { contains: s, mode: "insensitive" } } },
    ];
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

  if (query.board) {
    // Board mode: no pagination; completed column is capped to today
    if (query.status === "COMPLETED") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      where.completedAt = { gte: todayStart };
    }
    const orders = await orderRepository.findMany({
      where,
      include: orderRepository.listInclude,
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return { orders, total: orders.length, pages: 1 };
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


