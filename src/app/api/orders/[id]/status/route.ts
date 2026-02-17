import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validations";
import type { OrderStatus } from "@/generated/prisma/client";
import { requireTenant, handleTenantError } from "@/lib/tenant";

export async function PATCH(
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
    const { status: newStatus } = orderStatusSchema.parse(body);

    const existingOrder = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const currentStatus = existingOrder.status;

    if (currentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "No se puede cambiar el estado de una orden completada" },
        { status: 400 }
      );
    }

    if (currentStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede cambiar el estado de una orden cancelada" },
        { status: 400 }
      );
    }

    const updateData: {
      status: OrderStatus;
      startedAt?: Date;
      completedAt?: Date;
    } = {
      status: newStatus as OrderStatus,
    };

    if (currentStatus === "PENDING" && newStatus === "IN_PROGRESS") {
      updateData.startedAt = new Date();
    } else if (currentStatus === "IN_PROGRESS" && newStatus === "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (newStatus === "CANCELLED") {
      // Se permite cancelar desde PENDING o IN_PROGRESS
    } else if (currentStatus === "PENDING" && newStatus === "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "No se puede completar una orden que no esta en progreso",
        },
        { status: 400 }
      );
    } else if (currentStatus === "IN_PROGRESS" && newStatus === "PENDING") {
      return NextResponse.json(
        {
          error:
            "No se puede regresar una orden en progreso a pendiente",
        },
        { status: 400 }
      );
    } else if (newStatus === currentStatus) {
      return NextResponse.json(
        { error: "La orden ya se encuentra en ese estado" },
        { status: 400 }
      );
    }

    const order = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
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
        { error: "Estado de orden invalido", details: error },
        { status: 400 }
      );
    }

    console.error("Error al cambiar estado de la orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
