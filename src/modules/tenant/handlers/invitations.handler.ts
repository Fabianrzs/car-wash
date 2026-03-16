import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { getInvitationsService } from "@/modules/tenant/services/invitations.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const invitations = await getInvitationsService(tenantId);

    return ApiResponse.ok(invitations);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener invitaciones:");
  }
}
