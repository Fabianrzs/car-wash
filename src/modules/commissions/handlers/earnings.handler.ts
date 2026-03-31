import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleCommissionHttpError } from "@/modules/commissions/commission.errors";
import { listEarningsService } from "@/modules/commissions/services/list-earnings.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? undefined;
    const status = searchParams.get("status") as "PENDING" | "PAID" | undefined;

    const data = await listEarningsService({ tenantId, userId, status });
    return ApiResponse.ok(data);
  } catch (error) {
    return handleCommissionHttpError(error, "Error al obtener ganancias:");
  }
}
