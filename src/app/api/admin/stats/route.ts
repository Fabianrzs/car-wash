import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      tenantsThisMonth,
      tenantsLastMonth,
      plans,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.serviceOrder.count(),
      prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.tenant.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      prisma.plan.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { tenants: { where: { isActive: true } } } },
        },
      }),
      prisma.tenant.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          plan: { select: { name: true } },
          _count: { select: { serviceOrders: true, clients: true, tenantUsers: true } },
        },
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    for (const plan of plans) {
      const tenantCount = plan._count.tenants;
      const monthlyPrice =
        plan.interval === "YEARLY"
          ? Number(plan.price) / 12
          : Number(plan.price);
      mrr += monthlyPrice * tenantCount;
    }

    const tenantGrowth =
      tenantsLastMonth > 0
        ? ((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth) * 100
        : tenantsThisMonth > 0
        ? 100
        : 0;

    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      mrr: Math.round(mrr * 100) / 100,
      tenantsThisMonth,
      tenantGrowth: Math.round(tenantGrowth * 100) / 100,
      recentTenants,
    });
  } catch (error) {
    console.error("Error al obtener estadisticas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
