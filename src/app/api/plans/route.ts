import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        interval: true,
        maxUsers: true,
        maxOrdersPerMonth: true,
        features: true,
      },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
