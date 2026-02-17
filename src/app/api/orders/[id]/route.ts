import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { requireTenant, handleTenantError } from "@/lib/tenant";

const updateOrderNotesSchema = z.object({
  notes: z.string().max(1000).optional().or(z.literal("")),
});

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

    const order = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
            year: true,
            color: true,
            vehicleType: true,
          },
        },
        items: {
          include: {
            serviceType: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    const validatedData = updateOrderNotesSchema.parse(body);

    const existingOrder = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: {
        notes: validatedData.notes || null,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
          },
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
    });

    return NextResponse.json(order);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de orden invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error al actualizar orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
