import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, handleTenantError } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      switch (period) {
        case "daily":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    const dateFilter = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [
      completedOrdersAgg,
      orderCount,
      completedOrdersCount,
      inProgressOrdersCount,
      allOrders,
      topServicesData,
      uniqueClientsData,
    ] = await Promise.all([
      prisma.serviceOrder.aggregate({
        where: {
          ...dateFilter,
          status: "COMPLETED",
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.serviceOrder.count({
        where: dateFilter,
      }),
      prisma.serviceOrder.count({
        where: {
          ...dateFilter,
          status: "COMPLETED",
        },
      }),
      prisma.serviceOrder.count({
        where: {
          ...dateFilter,
          status: "IN_PROGRESS",
        },
      }),
      prisma.serviceOrder.findMany({
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
      prisma.orderItem.groupBy({
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
      prisma.serviceOrder.groupBy({
        by: ["clientId"],
        where: dateFilter,
      }),
    ]);

    const totalIncome = Number(completedOrdersAgg._sum.totalAmount || 0);
    const averageOrderValue =
      completedOrdersCount > 0 ? totalIncome / completedOrdersCount : 0;

    // Build daily breakdown
    const dailyMap = new Map<
      string,
      { date: string; income: number; orders: number }
    >();

    for (const order of allOrders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        income: 0,
        orders: 0,
      };
      existing.income += Number(order.totalAmount);
      existing.orders += 1;
      dailyMap.set(dateKey, existing);
    }

    const dailyBreakdown = Array.from(dailyMap.values());

    // Get service type names for top services
    const serviceTypeIds = topServicesData.map((s) => s.serviceTypeId);
    const serviceTypes = await prisma.serviceType.findMany({
      where: { id: { in: serviceTypeIds } },
      select: { id: true, name: true },
    });

    const serviceTypeNameMap = new Map(
      serviceTypes.map((st) => [st.id, st.name])
    );

    const topServices = topServicesData.map((s) => ({
      serviceTypeId: s.serviceTypeId,
      name: serviceTypeNameMap.get(s.serviceTypeId) || "Servicio desconocido",
      totalRevenue: Number(s._sum.subtotal || 0),
      totalQuantity: Number(s._sum.quantity || 0),
      orderCount: s._count.id,
    }));

    return NextResponse.json({
      totalIncome,
      orderCount,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      completedOrders: completedOrdersCount,
      inProgressOrders: inProgressOrdersCount,
      uniqueClients: uniqueClientsData.length,
      dailyBreakdown,
      topServices,
    });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al generar reporte:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
