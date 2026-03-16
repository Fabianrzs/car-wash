import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { getMyOrderStatsService } from "@/modules/orders/services/get-my-order-stats.service";

export async function getMyOrderStatsHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);

    const stats = await getMyOrderStatsService({
      tenantId,
      userId: session.user.id,
    });

    return ApiResponse.ok(stats);
  } catch (error) {
    return handleOrderHttpError(error, "Error al obtener estadisticas:");
  }
}



