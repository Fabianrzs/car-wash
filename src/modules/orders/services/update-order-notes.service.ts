import { OrderModuleError } from "@/modules/orders/order.errors";
import { orderRepository } from "@/modules/orders/repositories/order.repository";

interface UpdateOrderNotesServiceInput {
  tenantId: string;
  id: string;
  notes?: string;
}

export async function updateOrderNotesService({ tenantId, id, notes }: UpdateOrderNotesServiceInput) {
  const existingOrder = await orderRepository.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });

  if (!existingOrder) {
    throw new OrderModuleError("Orden no encontrada", 404);
  }

  return orderRepository.update({
    where: { id },
    data: {
      notes: notes || null,
    },
    include: orderRepository.mutateInclude,
  });
}


