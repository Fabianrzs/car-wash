import { OrderModuleError } from "@/modules/orders/order.errors";
import { orderRepository } from "@/modules/orders/repositories/order.repository";

interface GetOrderDetailServiceInput {
  tenantId: string;
  id: string;
}

export async function getOrderDetailService({ tenantId, id }: GetOrderDetailServiceInput) {
  const order = await orderRepository.findFirst({
    where: { id, tenantId },
    include: orderRepository.detailInclude,
  });

  if (!order) {
    throw new OrderModuleError("Orden no encontrada", 404);
  }

  return order;
}


