import { prisma } from "@/database/prisma";

export interface PublicStats {
  totalTenants: number;
  totalOrders: number;
  totalClients: number;
  totalVehicles: number;
}

export async function getPublicStatsService(): Promise<PublicStats> {
  const [totalTenants, totalOrders, totalClients, totalVehicles] = await Promise.all([
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.serviceOrder.count(),
    prisma.client.count(),
    prisma.vehicle.count(),
  ]);
  return { totalTenants, totalOrders, totalClients, totalVehicles };
}

