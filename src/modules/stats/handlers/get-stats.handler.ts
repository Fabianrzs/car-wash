import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleStatsHttpError } from "@/modules/stats/stats.errors";
import { getStatsService } from "@/modules/stats/services/get-stats.service";

export async function getStatsHandler() {
  try {
    await requireSuperAdmin();
    const stats = await getStatsService();
    return ApiResponse.ok(stats);
  } catch (error) {
    return handleStatsHttpError(error, "Error al obtener estadisticas:");
  }
}


