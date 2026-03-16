import { publicStatsRepository } from "@/modules/public-stats/repositories/public-stats.repository";

export interface PublicStats {
  totalTenants: number;
  totalOrders: number;
  totalClients: number;
  totalVehicles: number;
}

export async function getPublicStatsService(): Promise<PublicStats> {
  return publicStatsRepository.getSummary();
}

