import { requireTenantMember } from "@/lib";
import { OrderModuleError } from "@/modules/orders/order.errors";
import { orderRepository } from "@/modules/orders/repositories/order.repository";

interface AssignOrderServiceInput {
  tenantId: string;
  orderId: string;
  assignedToId?: string | null;
  currentUserId: string;
  currentUserGlobalRole?: string;
}

export async function assignOrderService({
  tenantId,
  orderId,
  assignedToId,
  currentUserId,
  currentUserGlobalRole,
}: AssignOrderServiceInput) {
  const tenantUser = await requireTenantMember(currentUserId, tenantId, currentUserGlobalRole);

  const existingOrder = await orderRepository.findFirst({
    where: { id: orderId, tenantId },
    select: { id: true, assignedToId: true },
  });

  if (!existingOrder) {
    throw new OrderModuleError("Orden no encontrada", 404);
  }

  if (tenantUser.role === "EMPLOYEE") {
    if (assignedToId !== currentUserId) {
      throw new OrderModuleError("Solo puedes asignarte órdenes a ti mismo", 403);
    }
    if (existingOrder.assignedToId) {
      throw new OrderModuleError("Esta orden ya tiene un lavador asignado", 400);
    }
  }

  if (assignedToId !== null && assignedToId !== undefined) {
    const assignee = await orderRepository.findFirstTenantUser({
      where: {
        tenantId,
        userId: assignedToId,
        isActive: true,
        user: { globalRole: "USER" },
      },
      select: { id: true },
    });

    if (!assignee) {
      throw new OrderModuleError("El usuario asignado no es miembro activo del tenant", 400);
    }
  }

  return orderRepository.update({
    where: { id: orderId },
    data: { assignedToId: assignedToId ?? null },
    include: orderRepository.assignInclude,
  });
}


