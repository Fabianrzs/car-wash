import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const plans = await prisma.plan.findMany({
      include: {
        _count: { select: { tenants: true } },
      },
      orderBy: { price: "asc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, price, interval, maxUsers, maxOrdersPerMonth, stripePriceId, features } = body;

    if (!name || !slug || price === undefined) {
      return NextResponse.json({ error: "Nombre, slug y precio son requeridos" }, { status: 400 });
    }

    const existingPlan = await prisma.plan.findUnique({ where: { slug } });
    if (existingPlan) {
      return NextResponse.json({ error: "El slug ya esta en uso" }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        price,
        interval: interval || "MONTHLY",
        maxUsers: maxUsers || 5,
        maxOrdersPerMonth: maxOrdersPerMonth || 500,
        stripePriceId,
        features: features || [],
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Error al crear plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
