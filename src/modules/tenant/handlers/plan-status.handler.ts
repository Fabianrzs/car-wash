import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, TenantError } from "@/lib";
import { getTenantPlanStatusService } from "@/modules/tenant/services/plan-status.service";

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

    const status = await getTenantPlanStatusService(tenantId);
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    if (error instanceof Error && error.message.includes("Tenant no encontrado")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error al obtener estado del plan:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
