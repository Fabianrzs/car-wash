import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { sendOrderStatusChangeEmail } from "@/lib/email";
import { OrderModuleError } from "@/modules/orders/order.errors";
import { orderRepository } from "@/modules/orders/repositories/order.repository";
import {
  buildStatusUpdateData,
  resolveActorName,
} from "@/modules/orders/order.utils";

interface UpdateOrderStatusServiceInput {
  tenantId: string;
  orderId: string;
  newStatus: OrderStatus;
  changedBy: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export async function updateOrderStatusService({
  tenantId,
  orderId,
  newStatus,
  changedBy,
}: UpdateOrderStatusServiceInput) {
  const statusSelect = orderRepository.statusSelect;
  const existingOrder = await orderRepository.findFirst({
    where: { id: orderId, tenantId },
    select: statusSelect,
  }) as Prisma.ServiceOrderGetPayload<{ select: typeof statusSelect }> | null;

  if (!existingOrder) {
    throw new OrderModuleError("Orden no encontrada", 404);
  }

  const currentStatus = existingOrder.status;
  const updateData = buildStatusUpdateData(currentStatus, newStatus);

  const updatedOrder = await orderRepository.update({
    where: { id: orderId },
    data: updateData,
    include: orderRepository.mutateInclude,
  });

  const changedByName = resolveActorName(changedBy);
  const clientName = `${existingOrder.client.firstName} ${existingOrder.client.lastName}`;

  Promise.all([
    orderRepository.findManyTenantUsers({
      where: {
        tenantId,
        role: { in: ["OWNER", "ADMIN"] },
        user: { globalRole: "USER" },
      },
      include: { user: { select: { email: true, id: true } } },
    }).then((admins) => {
      const tenantAdmins = admins as Prisma.TenantUserGetPayload<{
        include: { user: { select: { email: true; id: true } } };
      }>[];
      const recipients = new Map<string, string>();
      for (const member of tenantAdmins) {
        recipients.set(member.user.id, member.user.email);
      }

      if (existingOrder.assignedTo && existingOrder.assignedTo.id !== changedBy.id) {
        recipients.set(existingOrder.assignedTo.id, existingOrder.assignedTo.email!);
      }

      return Promise.all(
        Array.from(recipients.values()).map((email) =>
          sendOrderStatusChangeEmail(
            email,
            existingOrder.tenant.name,
            existingOrder.orderNumber,
            newStatus,
            clientName,
            changedByName
          )
        )
      );
    }),
  ]).catch((error) => console.error("Error sending order status emails:", error));

  return updatedOrder;
}




