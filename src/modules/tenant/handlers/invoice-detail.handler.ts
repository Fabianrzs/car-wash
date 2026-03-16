import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { getInvoiceDetailByIdService } from "@/modules/tenant/services/invoices.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const { id } = await params;

    const invoice = await getInvoiceDetailByIdService(tenantId, id);

    if (!invoice) {
      return ApiResponse.notFound("Factura no encontrada");
    }

    return ApiResponse.ok(invoice);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener factura:");
  }
}
