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
import { updateServiceService } from "@/modules/services/services/update-service.service";
import {
  serviceIdParamsSchema,
  serviceTypeSchema,
} from "@/modules/services/validations/service.validation";

export async function updateServiceHandler(
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
    const body = await request.json();
    const data = serviceTypeSchema.parse(body);
    const service = await updateServiceService({
      tenantId,
      serviceId: routeParams.id,
      data,
    });

    return ApiResponse.ok(service);
  } catch (error) {
    return handleServiceHttpError(error, "Error al actualizar servicio:");
  }
}

