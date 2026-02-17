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
      tenantsByActive,
      totalUsers,
      totalOrders,
      tenantsByMonth,
      plans,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.groupBy({
        by: ["isActive"],
        _count: { id: true },
      }),
      prisma.user.count(),
      prisma.serviceOrder.count(),
      prisma.tenant.findMany({
        where: { createdAt: { gte: startOfLastMonth } },
        select: { createdAt: true },
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

    // Derive tenant counts from groupBy
    const activeCount = tenantsByActive.find((t) => t.isActive)?._count.id || 0;
    const inactiveCount = tenantsByActive.find((t) => !t.isActive)?._count.id || 0;
    const totalTenants = activeCount + inactiveCount;
    const activeTenants = activeCount;

    // Derive monthly counts from findMany in memory
    const tenantsThisMonth = tenantsByMonth.filter((t) => t.createdAt >= startOfMonth).length;
    const tenantsLastMonth = tenantsByMonth.filter(
      (t) => t.createdAt >= startOfLastMonth && t.createdAt <= endOfLastMonth
    ).length;

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
