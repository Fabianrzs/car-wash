import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clientSchema } from "@/lib/validations";
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

    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        vehicles: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            vehicle: true,
            items: {
              include: {
                serviceType: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener cliente:", error);
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
    const validatedData = clientSchema.parse(body);

    const existingClient = await prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
        notes: validatedData.notes || null,
        isFrequent: validatedData.isFrequent,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de cliente invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error al actualizar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const existingClient = await prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    const activeOrders = await prisma.serviceOrder.count({
      where: {
        clientId: id,
        tenantId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el cliente porque tiene ordenes activas",
        },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
