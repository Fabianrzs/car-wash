import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { getInvoicesPageService } from "@/modules/tenant/services/invoices.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = 10;

    const result = await getInvoicesPageService(tenantId, { status, page, limit });
    return ApiResponse.ok(result);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener facturas:");
  }
}
