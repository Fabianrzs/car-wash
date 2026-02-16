import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { clientSchema } from "@/lib/validations";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { Prisma } from "@/generated/prisma/client";
import { requireTenant, handleTenantError } from "@/lib/tenant";

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
    const frequent = searchParams.get("frequent") || searchParams.get("isFrequent");

    const where: Prisma.ClientWhereInput = { tenantId };

    if (search) {
      const searchTerms = search.trim().split(/\s+/);
      if (searchTerms.length > 1) {
        where.OR = [
          {
            AND: [
              { firstName: { contains: searchTerms[0], mode: "insensitive" } },
              { lastName: { contains: searchTerms.slice(1).join(" "), mode: "insensitive" } },
            ],
          },
          { phone: { contains: search, mode: "insensitive" } },
        ];
      } else {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    if (frequent === "true") {
      where.isFrequent = true;
    } else if (frequent === "false") {
      where.isFrequent = false;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { orders: true, vehicles: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      pages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener clientes:", error);
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

    const { tenantId } = await requireTenant(request.headers);

    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
        notes: validatedData.notes || null,
        isFrequent: validatedData.isFrequent,
        tenant: { connect: { id: tenantId } },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de cliente invalidos", details: error },
        { status: 400 }
      );
    }

    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
