import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
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
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehiculo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
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

    const { id } = await params;
    const body = await request.json();
    const validatedData = vehicleSchema.parse(body);

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
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
        id: { not: id },
      },
    });

    if (duplicatePlate) {
      return NextResponse.json(
        { error: "Ya existe otro vehiculo con esa placa" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        plate: validatedData.plate,
        brand: validatedData.brand,
        model: validatedData.model,
        year: validatedData.year ?? null,
        color: validatedData.color || null,
        vehicleType: validatedData.vehicleType,
        clientId: validatedData.clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de vehiculo invalidos", details: error },
        { status: 400 }
      );
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

    const { id } = await params;

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
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
    console.error("Error al eliminar vehiculo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
