import { prisma } from "@/database/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    const superadmin = await prisma.user.findFirst({
      where: { email: "superadmin@carwash.com" },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        password: true,
      },
    });

    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const tenantCount = await prisma.tenant.count();
    const tenants = await prisma.tenant.findMany({
      take: 3,
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      database: { connected: true, userCount, tenantCount },
      superadmin: superadmin
        ? {
            found: true,
            name: superadmin.name,
            email: superadmin.email,
            globalRole: superadmin.globalRole,
            hasPassword: !!superadmin.password,
          }
        : { found: false },
      sampleUsers: users,
      sampleTenants: tenants,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "DB connection failed", details: msg }, { status: 500 });
  }
}

