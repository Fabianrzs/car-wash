import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantUsers = await prisma.tenantUser.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      tenant: { select: { id: true, name: true, slug: true, isActive: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const tenants = tenantUsers
    .map((tu) => tu.tenant)
    .filter((t) => t.isActive);

  return NextResponse.json({ tenants });
}
