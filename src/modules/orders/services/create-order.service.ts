import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/prisma";
import { generateOrderNumber } from "@/lib/utils/order-number";
import type { OrderInput } from "@/modules/orders/validations/order.validation";
import { OrderModuleError } from "@/modules/orders/order.errors";
import { orderRepository } from "@/modules/orders/repositories/order.repository";
import { buildOrderItemsForCreate } from "@/modules/orders/order.utils";

interface CreateOrderServiceInput {
  tenantId: string;
  createdById: string;
  data: OrderInput;
}

export async function createOrderService({ tenantId, createdById, data }: CreateOrderServiceInput) {
  const runTransaction = () =>
    prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tenantId, tx);

      const serviceTypeIds = data.items.map((item) => item.serviceTypeId);
      const serviceTypes = await orderRepository.findManyServiceTypes({
        where: { id: { in: serviceTypeIds }, tenantId, isActive: true },
      }, tx);

      if (serviceTypes.length !== serviceTypeIds.length) {
        throw new OrderModuleError("Uno o mas servicios no son validos o estan inactivos", 400);
      }

      const junction = await orderRepository.findFirstClientVehicle({
        where: { clientId: data.clientId, vehicleId: data.vehicleId, tenantId },
        select: { id: true },
      }, tx);

      if (!junction) {
        const [clientExists, vehicleExists] = await Promise.all([
          orderRepository.findFirstClient({ where: { id: data.clientId, tenantId }, select: { id: true } }, tx),
          orderRepository.findFirstVehicle({ where: { id: data.vehicleId, tenantId }, select: { id: true } }, tx),
        ]);
        if (!clientExists) throw new OrderModuleError("El cliente no pertenece a este lavadero", 400);
        if (!vehicleExists) throw new OrderModuleError("El vehiculo no pertenece a este lavadero", 400);
        throw new OrderModuleError("El vehiculo no esta asociado a este cliente", 400);
      }

      const { orderItems, totalAmount } = buildOrderItemsForCreate(data.items, serviceTypes);

      return orderRepository.create({
        data: {
          orderNumber,
          status: "PENDING",
          totalAmount,
          notes: data.notes || null,
          client: { connect: { id: data.clientId } },
          vehicle: { connect: { id: data.vehicleId } },
          createdBy: { connect: { id: createdById } },
          tenant: { connect: { id: tenantId } },
          ...(data.assignedToId
            ? { assignedTo: { connect: { id: data.assignedToId } } }
            : {}),
          items: { create: orderItems },
        },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          items: { include: { serviceType: { select: { id: true, name: true } } } },
        },
      }, tx);
    });

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await runTransaction();
    } catch (error) {
      const isOrderNumberConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (isOrderNumberConflict && attempt < 2) continue;
      throw error;
    }
  }

  throw new OrderModuleError("No fue posible crear la orden", 500);
}



