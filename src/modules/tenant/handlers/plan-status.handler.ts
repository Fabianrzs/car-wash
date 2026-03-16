import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { getTenantPlanStatusService } from "@/modules/tenant/services/plan-status.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    // SUPER_ADMIN is never blocked
    if (session.user.globalRole === "SUPER_ADMIN") {
      return ApiResponse.ok({
        isBlocked: false,
        reason: null,
        trialEndsAt: null,
        planName: null,
        daysLeft: null,
        pendingInvoiceId: null,
      });
    }

    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const status = await getTenantPlanStatusService(tenantId);
    return ApiResponse.ok(status);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener estado del plan:");
  }
}
