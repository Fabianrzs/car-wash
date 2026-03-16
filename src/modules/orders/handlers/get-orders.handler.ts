import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { listOrdersService } from "@/modules/orders/services/list-orders.service";
import { listOrdersQuerySchema } from "@/modules/orders/validations/order.validation";

export async function getOrdersHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const { searchParams } = new URL(request.url);
    const query = listOrdersQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      assignedToMe: searchParams.get("assignedToMe") ?? undefined,
      unassigned: searchParams.get("unassigned") ?? undefined,
    });

    const result = await listOrdersService({
      tenantId,
      userId: session.user.id,
      query,
    });

    return ApiResponse.ok(result);
  } catch (error) {
    return handleOrderHttpError(error, "Error al obtener ordenes:");
  }
}



