import type { OrderStatus } from "@/generated/prisma/client";
import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { updateOrderStatusService } from "@/modules/orders/services/update-order-status.service";
import {
  orderIdParamsSchema,
  orderStatusSchema,
} from "@/modules/orders/validations/order.validation";

export async function updateOrderStatusHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = orderIdParamsSchema.parse(await params);
    const body = await request.json();
    const { status: newStatus } = orderStatusSchema.parse(body);

    const order = await updateOrderStatusService({
      tenantId,
      orderId: routeParams.id,
      newStatus: newStatus as OrderStatus,
      changedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });

    return ApiResponse.ok(order);
  } catch (error) {
    return handleOrderHttpError(error, "Error al cambiar estado de la orden:");
  }
}



