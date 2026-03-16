import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { acceptInvitationForUserService } from "@/modules/tenant/services/invitations.service";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return ApiResponse.badRequest("Token requerido");
    }

    const result = await acceptInvitationForUserService(token, session.user.id);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleTenantHttpError(error, "Error al aceptar invitacion:");
  }
}
