import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { assignOrderService } from "@/modules/orders/services/assign-order.service";
import {
  orderAssignmentSchema,
  orderIdParamsSchema,
} from "@/modules/orders/validations/order.validation";

export async function assignOrderHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = orderIdParamsSchema.parse(await params);
    const body = await request.json();
    const { assignedToId } = orderAssignmentSchema.parse(body);

    const updatedOrder = await assignOrderService({
      tenantId,
      orderId: routeParams.id,
      assignedToId,
      currentUserId: session.user.id,
      currentUserGlobalRole: session.user.globalRole,
    });

    return ApiResponse.ok(updatedOrder);
  } catch (error) {
    return handleOrderHttpError(error, "Error al asignar orden:");
  }
}



