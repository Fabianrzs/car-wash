import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { updateOrderNotesService } from "@/modules/orders/services/update-order-notes.service";
import {
  orderIdParamsSchema,
  updateOrderNotesSchema,
} from "@/modules/orders/validations/order.validation";

export async function updateOrderNotesHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = orderIdParamsSchema.parse(await params);
    const body = await request.json();
    const validatedData = updateOrderNotesSchema.parse(body);

    const order = await updateOrderNotesService({
      tenantId,
      id: routeParams.id,
      notes: validatedData.notes,
    });

    return ApiResponse.ok(order);
  } catch (error) {
    return handleOrderHttpError(error, "Error al actualizar orden:");
  }
}



