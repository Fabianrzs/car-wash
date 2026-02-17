import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validations";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { Prisma } from "@/generated/prisma/client";
import { requireTenant, requireActivePlan, handleTenantError } from "@/lib/tenant";

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
      where.clientId = clientId;
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
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
    try { return handleTenantError(error); } catch {}
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

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: validatedData.plate,
        brand: validatedData.brand,
        model: validatedData.model,
        year: validatedData.year ?? null,
        color: validatedData.color || null,
        vehicleType: validatedData.vehicleType,
        client: { connect: { id: validatedData.clientId } },
        tenant: { connect: { id: tenantId } },
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

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de vehiculo invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error al crear vehiculo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
