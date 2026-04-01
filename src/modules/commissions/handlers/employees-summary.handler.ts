import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleCommissionHttpError } from "@/modules/commissions/commission.errors";
import { getEmployeesCommissionSummaryService } from "@/modules/commissions/services/get-employees-commission-summary.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const summary = await getEmployeesCommissionSummaryService(tenantId);
    return ApiResponse.ok(summary);
  } catch (error) {
    return handleCommissionHttpError(error, "Error al obtener resumen de comisiones:");
  }
}
