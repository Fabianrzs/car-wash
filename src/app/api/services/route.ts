import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serviceTypeSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";
import { requireTenant, requireTenantMember, requireActivePlan, handleTenantError } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where: Prisma.ServiceTypeWhereInput = { tenantId };

    if (active === "true") {
      where.isActive = true;
    }

    const services = await prisma.serviceType.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener servicios:", error);
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
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta accion" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = serviceTypeSchema.parse(body);

    const existingService = await prisma.serviceType.findFirst({
      where: { name: validatedData.name, tenantId },
      select: { id: true },
    });

    if (existingService) {
      return NextResponse.json(
        { error: "Ya existe un servicio con ese nombre" },
        { status: 400 }
      );
    }

    const service = await prisma.serviceType.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        duration: validatedData.duration,
        isActive: validatedData.isActive,
        tenant: { connect: { id: tenantId } },
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de servicio invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error al crear servicio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
