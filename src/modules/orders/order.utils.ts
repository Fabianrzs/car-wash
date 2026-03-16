import type { OrderStatus } from "@/generated/prisma/client";
import { OrderModuleError } from "@/modules/orders/order.errors";

interface ServiceTypePrice {
  id: string;
  price: unknown;
}

interface OrderItemInput {
  serviceTypeId: string;
  quantity: number;
}

export function getDayRange(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function buildOrderItemsForCreate(
  items: OrderItemInput[],
  serviceTypes: ServiceTypePrice[]
) {
  const priceMap = new Map(serviceTypes.map((serviceType) => [serviceType.id, Number(serviceType.price)]));
  let totalAmount = 0;

  const orderItems = items.map((item) => {
    const unitPrice = priceMap.get(item.serviceTypeId);

    if (unitPrice === undefined) {
      throw new OrderModuleError("Uno o mas servicios no son validos o estan inactivos", 400);
    }

    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;

    return {
      serviceType: { connect: { id: item.serviceTypeId } },
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });

  return { orderItems, totalAmount };
}

export function buildStatusUpdateData(currentStatus: OrderStatus, newStatus: OrderStatus) {
  if (currentStatus === "COMPLETED") {
    throw new OrderModuleError("No se puede cambiar el estado de una orden completada", 400);
  }

  if (currentStatus === "CANCELLED") {
    throw new OrderModuleError("No se puede cambiar el estado de una orden cancelada", 400);
  }

  if (newStatus === currentStatus) {
    throw new OrderModuleError("La orden ya se encuentra en ese estado", 400);
  }

  if (currentStatus === "PENDING" && newStatus === "COMPLETED") {
    throw new OrderModuleError("No se puede completar una orden que no esta en progreso", 400);
  }

  if (currentStatus === "IN_PROGRESS" && newStatus === "PENDING") {
    throw new OrderModuleError("No se puede regresar una orden en progreso a pendiente", 400);
  }

  const updateData: {
    status: OrderStatus;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: newStatus };

  if (currentStatus === "PENDING" && newStatus === "IN_PROGRESS") {
    updateData.startedAt = new Date();
  }

  if (currentStatus === "IN_PROGRESS" && newStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  return updateData;
}

export function resolveActorName(actor: { name?: string | null; email?: string | null }) {
  return actor.name ?? actor.email ?? "Un usuario";
}

