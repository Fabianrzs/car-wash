import { prisma } from "@/database/prisma";

class PublicStatsRepository {
  getSummary() {
    return Promise.all([
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.serviceOrder.count(),
      prisma.client.count(),
      prisma.vehicle.count(),
    ]).then(([totalTenants, totalOrders, totalClients, totalVehicles]) => ({
      totalTenants,
      totalOrders,
      totalClients,
      totalVehicles,
    }));
  }
}

export const publicStatsRepository = new PublicStatsRepository();

