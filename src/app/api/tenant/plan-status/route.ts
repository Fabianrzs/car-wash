import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, getTenantPlanStatus } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // SUPER_ADMIN is never blocked
    if (session.user.globalRole === "SUPER_ADMIN") {
      return NextResponse.json({
        isBlocked: false,
        reason: null,
        trialEndsAt: null,
        planName: null,
        daysLeft: null,
        pendingInvoiceId: null,
      });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // Check for pending/overdue invoices
    const pendingInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        status: { in: ["PENDING", "OVERDUE"] },
      },
      orderBy: { dueDate: "asc" },
      select: { id: true, dueDate: true },
    });

    const status = getTenantPlanStatus(tenant, pendingInvoice);
    return NextResponse.json(status);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener estado del plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
