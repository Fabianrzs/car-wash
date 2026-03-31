import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess } from "@/middleware/tenant.middleware";
import { handleCommissionHttpError } from "@/modules/commissions/commission.errors";
import { getMyEarningsService } from "@/modules/commissions/services/get-my-earnings.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const data = await getMyEarningsService({ tenantId, userId: session.user.id });
    return ApiResponse.ok(data);
  } catch (error) {
    return handleCommissionHttpError(error, "Error al obtener mis ganancias:");
  }
}
