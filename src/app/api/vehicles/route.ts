import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validations";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { Prisma } from "@/generated/prisma/client";
import { requireTenant, requireActivePlan, handleTenantError, TenantError } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const search = searchParams.get("search") || "";
    const clientId = searchParams.get("clientId") || "";

    const where: Prisma.VehicleWhereInput = { tenantId };

    if (search) {
      where.plate = { contains: search, mode: "insensitive" };
    }

    if (clientId) {
      where.clients = { some: { clientId } };
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: {
          clients: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      vehicles,
      total,
      pages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al obtener vehiculos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId, tenant } = await requireTenant(request.headers);
    await requireActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();
    const validatedData = vehicleSchema.parse(body);

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { plate: validatedData.plate, tenantId },
      select: { id: true },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: "Ya existe un vehiculo con esa placa" },
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

      const created = await tx.vehicle.create({
        data: {
          plate: validatedData.plate,
          brand: validatedData.brand,
          model: validatedData.model,
          year: validatedData.year ?? null,
          color: validatedData.color || null,
          vehicleType: validatedData.vehicleType,
          tenant: { connect: { id: tenantId } },
        },
      });

      await tx.clientVehicle.createMany({
        data: validatedData.clientIds.map((clientId) => ({
          clientId,
          vehicleId: created.id,
          tenantId,
        })),
      });

      return tx.vehicle.findFirst({
        where: { id: created.id },
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

    return NextResponse.json(vehicle, { status: 201 });
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

    console.error("Error al crear vehiculo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
