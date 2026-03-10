import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validations";
import { requireTenant, handleTenantError, TenantError } from "@/lib/tenant";

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

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        clients: {
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
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehiculo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al obtener vehiculo:", error);
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
    const validatedData = vehicleSchema.parse(body);

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { error: "Vehiculo no encontrado" },
        { status: 404 }
      );
    }

    const duplicatePlate = await prisma.vehicle.findFirst({
      where: {
        plate: validatedData.plate,
        tenantId,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicatePlate) {
      return NextResponse.json(
        { error: "Ya existe otro vehiculo con esa placa" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.$transaction(async (tx) => {
      const validClients = await tx.client.findMany({
        where: { id: { in: validatedData.clientIds }, tenantId },
        select: { id: true },
      });

      if (validClients.length !== validatedData.clientIds.length) {
        throw new Error("Uno o mas clientes no pertenecen a este lavadero");
      }

      await tx.vehicle.update({
        where: { id },
        data: {
          plate: validatedData.plate,
          brand: validatedData.brand,
          model: validatedData.model,
          year: validatedData.year ?? null,
          color: validatedData.color || null,
          vehicleType: validatedData.vehicleType,
        },
      });

      await tx.clientVehicle.deleteMany({ where: { vehicleId: id } });

      await tx.clientVehicle.createMany({
        data: validatedData.clientIds.map((clientId) => ({
          clientId,
          vehicleId: id,
          tenantId,
        })),
      });

      return tx.vehicle.findFirst({
        where: { id },
        include: {
          clients: {
            include: {
              client: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de vehiculo invalidos", details: error },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("no pertenecen")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error al actualizar vehiculo:", error);
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

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { error: "Vehiculo no encontrado" },
        { status: 404 }
      );
    }

    const activeOrders = await prisma.serviceOrder.count({
      where: {
        vehicleId: id,
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
            "No se puede eliminar el vehiculo porque tiene ordenes activas",
        },
        { status: 400 }
      );
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Vehiculo eliminado correctamente",
    });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al eliminar vehiculo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
