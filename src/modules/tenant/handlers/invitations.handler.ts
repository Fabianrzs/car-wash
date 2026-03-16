import { NextResponse } from "next/server";
import { prisma } from "@/database/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, TenantError } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al obtener invitaciones:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
