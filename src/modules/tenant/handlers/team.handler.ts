import { ApiResponse, ForbiddenError } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import {
  getTeamMembersService,
  inviteTeamMemberService,
  updateTeamMemberRoleService,
  removeTeamMemberService,
} from "@/modules/tenant/services/team.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const members = await getTeamMembersService(tenantId);

    return ApiResponse.ok(members);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener equipo:");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return ApiResponse.badRequest("Email requerido");
    }

    const { invitation, emailError } = await inviteTeamMemberService(
      tenantId,
      session.user.id,
      session.user.name ?? session.user.email ?? "Un administrador",
      email,
      role || "EMPLOYEE"
    );

    return ApiResponse.created({ ...invitation, emailError });
  } catch (error) {
    return handleTenantHttpError(error, "Error al invitar miembro:");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const tenantUser = await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role !== "OWNER") {
      throw new ForbiddenError("Solo el propietario puede cambiar roles");
    }

    const body = await request.json();
    const { tenantUserId, role } = body;

    if (!tenantUserId || !role) {
      return ApiResponse.badRequest("ID y rol son requeridos");
    }

    if (!["ADMIN", "EMPLOYEE"].includes(role)) {
      return ApiResponse.badRequest("Rol invalido");
    }

    const updated = await updateTeamMemberRoleService(tenantId, tenantUserId, role);

    return ApiResponse.ok(updated);
  } catch (error) {
    return handleTenantHttpError(error, "Error al cambiar rol:");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const tenantUser = await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role !== "OWNER") {
      throw new ForbiddenError("Solo el propietario puede remover miembros");
    }

    const { searchParams } = new URL(request.url);
    const tenantUserId = searchParams.get("id");

    if (!tenantUserId) {
      return ApiResponse.badRequest("ID del miembro requerido");
    }

    await removeTeamMemberService(tenantId, tenantUserId);

    return ApiResponse.ok({ success: true });
  } catch (error) {
    return handleTenantHttpError(error, "Error al remover miembro:");
  }
}
