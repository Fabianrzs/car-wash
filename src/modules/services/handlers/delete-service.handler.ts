import { ApiResponse } from "@/lib/http/response";
import {
  requireAuth,
} from "@/middleware/auth.middleware";
import {
  ensureManagementAccess,
  requireTenantContext,
} from "@/middleware/tenant.middleware";
import {
  handleServiceHttpError,
} from "@/modules/services/service.errors";
import { deleteServiceService } from "@/modules/services/services/delete-service.service";
import { serviceIdParamsSchema } from "@/modules/services/validations/service.validation";

export async function deleteServiceHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(
      session.user.id,
      tenantId,
      session.user.globalRole
    );

    const routeParams = serviceIdParamsSchema.parse(await params);
    const response = await deleteServiceService({
      tenantId,
      serviceId: routeParams.id,
    });

    return ApiResponse.ok(response);
  } catch (error) {
    return handleServiceHttpError(error, "Error al desactivar servicio:");
  }
}

