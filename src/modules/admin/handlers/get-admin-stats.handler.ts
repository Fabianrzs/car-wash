import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleAdminHttpError } from "@/modules/admin/admin.errors";
import { getAdminStatsService } from "@/modules/admin/services/get-admin-stats.service";

export async function getAdminStatsHandler() {
  try {
    await requireSuperAdmin();
    const stats = await getAdminStatsService();
    return ApiResponse.ok(stats);
  } catch (error) {
    return handleAdminHttpError(error, "Error al obtener estadisticas:");
  }
}

