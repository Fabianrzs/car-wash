import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id, tenantId },
      include: {
        plan: true,
        items: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        tenant: {
          select: { name: true, slug: true, email: true, phone: true, address: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener factura:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
