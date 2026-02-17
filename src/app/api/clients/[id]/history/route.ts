import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { requireTenant, handleTenantError } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const where = { clientId: id, tenantId };

    const [orders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        include: {
          vehicle: {
            select: { id: true, plate: true, brand: true, model: true, vehicleType: true },
          },
          items: {
            include: {
              serviceType: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.serviceOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      pages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener historial del cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
