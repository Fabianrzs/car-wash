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
    const period = searchParams.get("period") || "monthly";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const statusFilter = searchParams.get("status") || "";
    const searchQuery = searchParams.get("search") || "";

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

    const where: Record<string, unknown> = {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (searchQuery) {
      where.OR = [
        { orderNumber: { contains: searchQuery, mode: "insensitive" } },
        { client: { firstName: { contains: searchQuery, mode: "insensitive" } } },
        { client: { lastName: { contains: searchQuery, mode: "insensitive" } } },
        { client: { phone: { contains: searchQuery, mode: "insensitive" } } },
        { vehicle: { plate: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true, phone: true },
        },
        vehicle: {
          select: { plate: true, brand: true, model: true },
        },
        items: {
          include: {
            serviceType: { select: { name: true } },
          },
        },
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build summary
    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const totalIncome = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalIncome / completedOrders.length : 0;

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

    return NextResponse.json({
      orders: formattedOrders,
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        orderCount: orders.length,
        completedOrders: completedOrders.length,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      },
    });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error en reporte de ordenes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
