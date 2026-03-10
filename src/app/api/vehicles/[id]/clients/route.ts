import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, handleTenantError, TenantError } from "@/lib/tenant";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const { id: vehicleId } = await params;
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId es requerido" },
        { status: 400 }
      );
    }

    const [vehicle, client] = await Promise.all([
      prisma.vehicle.findFirst({ where: { id: vehicleId, tenantId }, select: { id: true } }),
      prisma.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true } }),
    ]);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehiculo no encontrado" }, { status: 404 });
    }
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const junction = await prisma.clientVehicle.upsert({
      where: { clientId_vehicleId: { clientId, vehicleId } },
      create: { clientId, vehicleId, tenantId },
      update: {},
    });

    return NextResponse.json(junction, { status: 201 });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al asociar cliente:", error);
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
    const { id: vehicleId } = await params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId es requerido" },
        { status: 400 }
      );
    }

    const activeOrders = await prisma.serviceOrder.count({
      where: { vehicleId, clientId, tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "No se puede desasociar el cliente porque tiene ordenes activas con este vehiculo" },
        { status: 400 }
      );
    }

    await prisma.clientVehicle.deleteMany({
      where: { clientId, vehicleId },
    });

    return NextResponse.json({ message: "Asociacion eliminada correctamente" });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al desasociar cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
