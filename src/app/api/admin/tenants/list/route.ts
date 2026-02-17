import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || session.user.globalRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const tenants = await prisma.tenant.findMany({
      where,
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 5,
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error al listar tenants:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
