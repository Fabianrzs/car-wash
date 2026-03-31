import { reportRepository } from "@/modules/reports/repositories/report.repository";
import type { ReportQuery } from "@/modules/reports/validations/report.validation";
import {
  buildDailyBreakdown,
  resolveDateRange,
  roundMoney,
} from "@/modules/reports/report.utils";

interface GetReportSummaryServiceInput {
  tenantId: string;
  query: ReportQuery;
}

export async function getReportSummaryService({ tenantId, query }: GetReportSummaryServiceInput) {
  const { startDate, endDate } = resolveDateRange(query);

  const dateFilter = {
    tenantId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [completedOrdersAgg, statusCounts, allCompletedOrders, topServicesData, uniqueClientsData, payoutsAgg] = await Promise.all([
    reportRepository.aggregateOrders({
      where: {
        ...dateFilter,
        status: "COMPLETED",
      },
      _sum: {
        totalAmount: true,
      },
    }),
    reportRepository.groupOrdersByStatus({
      by: ["status"],
      where: dateFilter,
      _count: { id: true },
    }),
    reportRepository.findOrders({
      where: {
        ...dateFilter,
        status: "COMPLETED",
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    reportRepository.groupOrderItems({
      by: ["serviceTypeId"],
      where: {
        order: {
          ...dateFilter,
          status: "COMPLETED",
        },
      },
      _sum: {
        subtotal: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          subtotal: "desc",
        },
      },
      take: 10,
    }),
    reportRepository.groupOrdersByStatus({
      by: ["clientId"],
      where: dateFilter,
    }),
    reportRepository.aggregatePayouts({
      where: { tenantId, paidAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
    }),
  ]);

  const statusCountMap = new Map(statusCounts.map((item) => [item.status, (item._count as any)?.id || 0]));
  const orderCount = statusCounts.reduce((sum, item) => sum + ((item._count as any)?.id || 0), 0);
  const completedOrdersCount = statusCountMap.get("COMPLETED") || 0;
  const inProgressOrdersCount = statusCountMap.get("IN_PROGRESS") || 0;

  const totalIncome = Number(completedOrdersAgg._sum?.totalAmount || 0);
  const averageOrderValue = completedOrdersCount > 0 ? totalIncome / completedOrdersCount : 0;

  const dailyBreakdown = buildDailyBreakdown(allCompletedOrders);

  const serviceTypeIds = topServicesData.map((service) => service.serviceTypeId);
  const serviceTypes = await reportRepository.findServiceTypes({
    where: { id: { in: serviceTypeIds } },
    select: { id: true, name: true },
  });

  const serviceTypeNameMap = new Map(serviceTypes.map((serviceType) => [serviceType.id, serviceType.name]));

  const topServices = topServicesData.map((service) => ({
    serviceTypeId: service.serviceTypeId,
    name: serviceTypeNameMap.get(service.serviceTypeId) || "Servicio desconocido",
    totalRevenue: Number(service._sum?.subtotal || 0),
    totalQuantity: Number(service._sum?.quantity || 0),
    orderCount: (service._count as any)?.id || 0,
  }));

  const commissionsPaid = Number(payoutsAgg._sum?.totalAmount || 0);
  const netIncome = roundMoney(totalIncome - commissionsPaid);

  return {
    totalIncome,
    orderCount,
    averageOrderValue: roundMoney(averageOrderValue),
    completedOrders: completedOrdersCount,
    inProgressOrders: inProgressOrdersCount,
    uniqueClients: uniqueClientsData.length,
    commissionsPaid,
    netIncome,
    dailyBreakdown,
    topServices,
  };
}

