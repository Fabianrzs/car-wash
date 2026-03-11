import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { generateOrderNumber } from "@/lib/order-number";
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
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const clientId = searchParams.get("clientId") || "";
    const assignedToMe = searchParams.get("assignedToMe") === "true";
    const unassigned = searchParams.get("unassigned") === "true";

    const where: Prisma.ServiceOrderWhereInput = { tenantId };

    if (status) {
      where.status = status as any;
    }

    if (search) {
      where.orderNumber = { contains: search, mode: "insensitive" };
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (assignedToMe) {
      where.assignedToId = session.user.id;
    }

    if (unassigned) {
      where.assignedToId = null;
      if (!status) where.status = "PENDING";
    }

    const [orders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
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
          assignedTo: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.serviceOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      pages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al obtener ordenes:", error);
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

    const validationInput = {
      clientId: body.clientId,
      vehicleId: body.vehicleId,
      notes: body.notes,
      assignedToId: body.assignedToId || null,
      items: (body.items || []).map((item: { serviceTypeId: string; quantity: number }) => ({
        serviceTypeId: item.serviceTypeId,
        quantity: item.quantity || 1,
        unitPrice: 0,
        subtotal: 0,
      })),
    };

    const validatedData = orderSchema.parse(validationInput);

    const runTransaction = () =>
      prisma.$transaction(async (tx) => {
        const orderNumber = await generateOrderNumber(tenantId, tx);

        const serviceTypeIds = validatedData.items.map((item) => item.serviceTypeId);
        const serviceTypes = await tx.serviceType.findMany({
          where: { id: { in: serviceTypeIds }, tenantId, isActive: true },
        });

        if (serviceTypes.length !== serviceTypeIds.length) {
          throw new Error("Uno o mas servicios no son validos o estan inactivos");
        }

        const junction = await tx.clientVehicle.findFirst({
          where: { clientId: validatedData.clientId, vehicleId: validatedData.vehicleId, tenantId },
          select: { id: true },
        });

        if (!junction) {
          const [clientExists, vehicleExists] = await Promise.all([
            tx.client.findFirst({ where: { id: validatedData.clientId, tenantId }, select: { id: true } }),
            tx.vehicle.findFirst({ where: { id: validatedData.vehicleId, tenantId }, select: { id: true } }),
          ]);
          if (!clientExists) throw new Error("El cliente no pertenece a este lavadero");
          if (!vehicleExists) throw new Error("El vehiculo no pertenece a este lavadero");
          throw new Error("El vehiculo no esta asociado a este cliente");
        }

        const priceMap = new Map(serviceTypes.map((st) => [st.id, Number(st.price)]));
        let totalAmount = 0;
        const orderItems = validatedData.items.map((item) => {
          const unitPrice = priceMap.get(item.serviceTypeId)!;
          const subtotal = unitPrice * item.quantity;
          totalAmount += subtotal;
          return { serviceType: { connect: { id: item.serviceTypeId } }, quantity: item.quantity, unitPrice, subtotal };
        });

        return tx.serviceOrder.create({
          data: {
            orderNumber,
            status: "PENDING",
            totalAmount,
            notes: validatedData.notes || null,
            client: { connect: { id: validatedData.clientId } },
            vehicle: { connect: { id: validatedData.vehicleId } },
            createdBy: { connect: { id: session.user.id } },
            tenant: { connect: { id: tenantId } },
            ...(validatedData.assignedToId
              ? { assignedTo: { connect: { id: validatedData.assignedToId } } }
              : {}),
            items: { create: orderItems },
          },
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            vehicle: { select: { id: true, plate: true, brand: true, model: true } },
            items: { include: { serviceType: { select: { id: true, name: true } } } },
          },
        });
      });

    // Retry up to 3 times on orderNumber unique constraint collision
    let order;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        order = await runTransaction();
        break;
      } catch (err) {
        const isOrderNumberConflict =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002";
        if (isOrderNumberConflict && attempt < 2) continue;
        throw err;
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos de orden invalidos", details: error },
        { status: 400 }
      );
    }

    if (error instanceof Error && (
      error.message.includes("no son validos") ||
      error.message.includes("no pertenece") ||
      error.message.includes("no esta asociado")
    )) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error al crear orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
