import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleCommissionHttpError } from "@/modules/commissions/commission.errors";
import { getCommissionStatsService } from "@/modules/commissions/services/get-commission-stats.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const stats = await getCommissionStatsService(tenantId);
    return ApiResponse.ok(stats);
  } catch (error) {
    return handleCommissionHttpError(error, "Error al obtener estadísticas:");
  }
}
