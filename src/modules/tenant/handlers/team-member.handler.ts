import { ApiResponse, ForbiddenError } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import {
  deactivateTeamMemberService,
  updateTeamMemberRoleService,
} from "@/modules/tenant/services/team.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const currentUser = await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    if (currentUser.role !== "OWNER") {
      throw new ForbiddenError("Solo el propietario puede cambiar roles");
    }

    const { id } = await params;
    const body = await request.json();

    const member = await updateTeamMemberRoleService(tenantId, id, body.role);

    return ApiResponse.ok(member);
  } catch (error) {
    return handleTenantHttpError(error, "Error al actualizar miembro:");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const { id } = await params;

    const result = await deactivateTeamMemberService(tenantId, id);

    return ApiResponse.ok(result);
  } catch (error) {
    return handleTenantHttpError(error, "Error al remover miembro:");
  }
}
