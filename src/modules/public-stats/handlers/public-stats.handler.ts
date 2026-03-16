import { NextResponse } from "next/server";
import { getPublicStatsService } from "@/modules/public-stats/services/public-stats.service";

export async function GET() {
  try {
    const { totalTenants, totalOrders, totalClients, totalVehicles } =
      await getPublicStatsService();

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
