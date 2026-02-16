import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalTenants, totalOrders, totalClients, totalVehicles] = await Promise.all([
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.serviceOrder.count(),
      prisma.client.count(),
      prisma.vehicle.count(),
    ]);

    return NextResponse.json({
      totalTenants,
      totalOrders,
      totalClients,
      totalVehicles,
    });
  } catch (error) {
    console.error("Error al obtener estadisticas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
