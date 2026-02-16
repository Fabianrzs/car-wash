import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: { select: { tenants: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error al obtener plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        interval: body.interval,
        maxUsers: body.maxUsers,
        maxOrdersPerMonth: body.maxOrdersPerMonth,
        stripePriceId: body.stripePriceId,
        features: body.features,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error al actualizar plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
