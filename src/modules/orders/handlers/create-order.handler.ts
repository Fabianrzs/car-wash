import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { ensureActivePlan } from "@/middleware/plan.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleOrderHttpError } from "@/modules/orders/order.errors";
import { createOrderService } from "@/modules/orders/services/create-order.service";
import { orderSchema } from "@/modules/orders/validations/order.validation";

export async function createOrderHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();

    const validationInput = {
      clientId: body.clientId,
      vehicleId: body.vehicleId,
      notes: body.notes,
      assignedToId: body.assignedToId || null,
      items: (body.items || []).map((item: { serviceTypeId: string; quantity: number }) => ({
        serviceTypeId: item.serviceTypeId,
        quantity: item.quantity || 1,
        unitPrice: 0,
        subtotal: 0,
      })),
    };

    const validatedData = orderSchema.parse(validationInput);
    const order = await createOrderService({
      tenantId,
      createdById: session.user.id,
      data: validatedData,
    });

    return ApiResponse.created(order);
  } catch (error) {
    return handleOrderHttpError(error, "Error al crear orden:");
  }
}



