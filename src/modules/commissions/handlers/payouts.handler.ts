import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleCommissionHttpError } from "@/modules/commissions/commission.errors";
import { createPayoutSchema } from "@/modules/commissions/validations/commission.validation";
import { listPayoutsService } from "@/modules/commissions/services/list-payouts.service";
import { createPayoutService } from "@/modules/commissions/services/create-payout.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? undefined;

    const payouts = await listPayoutsService({ tenantId, userId });
    return ApiResponse.ok(payouts);
  } catch (error) {
    return handleCommissionHttpError(error, "Error al obtener pagos:");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const body = await request.json();
    const { userId, earningIds, notes } = createPayoutSchema.parse(body);

    const payout = await createPayoutService({
      tenantId,
      userId,
      earningIds,
      notes,
      paidById: session.user.id,
    });

    return ApiResponse.created(payout);
  } catch (error) {
    return handleCommissionHttpError(error, "Error al registrar pago:");
  }
}
