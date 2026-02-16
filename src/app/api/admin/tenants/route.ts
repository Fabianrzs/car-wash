import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true } },
          _count: {
            select: { tenantUsers: true, serviceOrders: true, clients: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants,
      total,
      pages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    console.error("Error al obtener tenants:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, email, phone, address, planId, ownerEmail } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug son requeridos" }, { status: 400 });
    }

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      return NextResponse.json({ error: "El slug ya esta en uso" }, { status: 400 });
    }

    // Check if plan is free trial for trialEndsAt
    let trialEndsAt: Date | null = null;
    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (plan && Number(plan.price) === 0) {
        trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name,
          slug,
          email,
          phone,
          address,
          trialEndsAt,
          ...(planId ? { plan: { connect: { id: planId } } } : {}),
        },
        include: { plan: true },
      });

      // Handle owner email
      if (ownerEmail) {
        let user = await tx.user.findUnique({ where: { email: ownerEmail } });

        if (!user) {
          const tempPassword = await bcrypt.hash("changeme123", 10);
          user = await tx.user.create({
            data: {
              email: ownerEmail,
              name: ownerEmail.split("@")[0],
              password: tempPassword,
            },
          });
        }

        await tx.tenantUser.create({
          data: {
            user: { connect: { id: user.id } },
            tenant: { connect: { id: newTenant.id } },
            role: "OWNER",
          },
        });
      }

      return newTenant;
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error("Error al crear tenant:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
