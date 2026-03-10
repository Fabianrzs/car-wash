import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, handleTenantError, TenantError } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const userId = session.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [today, pending, inProgress, completed, revenue] = await Promise.all([
      // Orders assigned to me created today
      prisma.serviceOrder.count({
        where: {
          tenantId,
          assignedToId: userId,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Pending assigned to me
      prisma.serviceOrder.count({
        where: { tenantId, assignedToId: userId, status: "PENDING" },
      }),
      // In progress assigned to me
      prisma.serviceOrder.count({
        where: { tenantId, assignedToId: userId, status: "IN_PROGRESS" },
      }),
      // Completed all time assigned to me
      prisma.serviceOrder.count({
        where: { tenantId, assignedToId: userId, status: "COMPLETED" },
      }),
      // Revenue from completed orders assigned to me
      prisma.serviceOrder.aggregate({
        where: { tenantId, assignedToId: userId, status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
    ]);

    return NextResponse.json({
      today,
      byStatus: { PENDING: pending, IN_PROGRESS: inProgress, COMPLETED: completed },
      totalCompleted: completed,
      totalRevenue: Number(revenue._sum.totalAmount ?? 0),
    });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al obtener estadisticas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
