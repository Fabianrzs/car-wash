import { orderRepository } from "@/modules/orders/repositories/order.repository";
import { getDayRange } from "@/modules/orders/order.utils";

interface GetMyOrderStatsServiceInput {
  tenantId: string;
  userId: string;
}

export async function getMyOrderStatsService({ tenantId, userId }: GetMyOrderStatsServiceInput) {
  const { start: todayStart, end: todayEnd } = getDayRange();

  const [today, pending, inProgress, completed, revenue] = await Promise.all([
    orderRepository.count({
      where: {
        tenantId,
        assignedToId: userId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    orderRepository.count({
      where: { tenantId, assignedToId: userId, status: "PENDING" },
    }),
    orderRepository.count({
      where: { tenantId, assignedToId: userId, status: "IN_PROGRESS" },
    }),
    orderRepository.count({
      where: { tenantId, assignedToId: userId, status: "COMPLETED" },
    }),
    orderRepository.aggregate({
      where: { tenantId, assignedToId: userId, status: "COMPLETED" },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    today,
    byStatus: { PENDING: pending, IN_PROGRESS: inProgress, COMPLETED: completed },
    totalCompleted: completed,
    totalRevenue: Number(revenue._sum?.totalAmount ?? 0),
  };
}




