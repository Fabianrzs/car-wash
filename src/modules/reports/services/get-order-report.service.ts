import type { Prisma } from "@/generated/prisma/client";
import { reportRepository } from "@/modules/reports/repositories/report.repository";
import type { OrderReportQuery } from "@/modules/reports/validations/report.validation";
import {
  resolveDateRange,
  summarizeOrdersForExport,
} from "@/modules/reports/report.utils";

interface GetOrderReportServiceInput {
  tenantId: string;
  query: OrderReportQuery;
}

export async function getOrderReportService({ tenantId, query }: GetOrderReportServiceInput) {
  const { startDate, endDate } = resolveDateRange(query);

  const where: Prisma.ServiceOrderWhereInput = {
    tenantId,
    createdAt: { gte: startDate, lte: endDate },
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: "insensitive" } },
      { client: { firstName: { contains: query.search, mode: "insensitive" } } },
      { client: { lastName: { contains: query.search, mode: "insensitive" } } },
      { client: { phone: { contains: query.search, mode: "insensitive" } } },
      { vehicle: { plate: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  const orders = await reportRepository.findOrders({
    where,
    include: {
      client: { select: { firstName: true, lastName: true, phone: true } },
      vehicle: { select: { plate: true, brand: true, model: true } },
      items: { include: { serviceType: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const summary = summarizeOrdersForExport(orders);

  const formattedOrders = orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    startedAt: order.startedAt?.toISOString() || null,
    completedAt: order.completedAt?.toISOString() || null,
    client: {
      firstName: order.client.firstName,
      lastName: order.client.lastName,
      phone: order.client.phone,
    },
    vehicle: {
      plate: order.vehicle.plate,
      brand: order.vehicle.brand,
      model: order.vehicle.model,
    },
    items: order.items.map((item) => ({
      serviceName: item.serviceType.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    createdBy: { name: order.createdBy.name || "N/A" },
  }));

  return {
    orders: formattedOrders,
    summary,
  };
}

