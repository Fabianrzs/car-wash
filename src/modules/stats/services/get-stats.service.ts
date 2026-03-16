import { orderRepository } from "@/modules/orders/repositories/order.repository";
import { planRepository } from "@/modules/plans/repositories/plan.repository";
import { tenantRepository } from "@/modules/tenants/repositories/tenant.repository";
import { userRepository } from "@/modules/users/repositories/user.repository";

export async function getStatsService() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalOrders,
    tenantsThisMonth,
    tenantsLastMonth,
    plans,
    recentTenants,
  ] = await Promise.all([
    tenantRepository.count(),
    tenantRepository.count({ where: { isActive: true } }),
    userRepository.count({}),
    orderRepository.count({}),
    tenantRepository.count({ where: { createdAt: { gte: startOfMonth } } }),
    tenantRepository.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    planRepository.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { tenants: { where: { isActive: true } } } },
      },
    }),
    tenantRepository.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        plan: { select: { name: true } },
        _count: { select: { serviceOrders: true, clients: true, tenantUsers: true } },
      },
    }),
  ]);

  let mrr = 0;
  for (const plan of plans) {
    const tenantCount = plan._count.tenants;
    const monthlyPrice = plan.interval === "YEARLY" ? Number(plan.price) / 12 : Number(plan.price);
    mrr += monthlyPrice * tenantCount;
  }

  const tenantGrowth =
    tenantsLastMonth > 0
      ? ((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth) * 100
      : tenantsThisMonth > 0
        ? 100
        : 0;

  return {
    totalTenants,
    activeTenants,
    totalUsers,
    totalOrders,
    mrr: Math.round(mrr * 100) / 100,
    tenantsThisMonth,
    tenantGrowth: Math.round(tenantGrowth * 100) / 100,
    recentTenants,
  };
}


