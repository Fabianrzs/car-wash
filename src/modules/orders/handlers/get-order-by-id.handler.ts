import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { getOrderDetailService } from "@/modules/orders/services/get-order-detail.service";
import { orderIdParamsSchema } from "@/modules/orders/validations/order.validation";

export async function getOrderByIdHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = orderIdParamsSchema.parse(await params);

    const order = await getOrderDetailService({
      tenantId,
      id: routeParams.id,
    });

    return ApiResponse.ok(order);
  } catch (error) {
    return handleOrderHttpError(error, "Error al obtener orden:");
  }
}



