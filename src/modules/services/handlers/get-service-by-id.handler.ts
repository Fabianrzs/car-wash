import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleServiceHttpError,
} from "@/modules/services/service.errors";
import { getServiceDetailService } from "@/modules/services/services/get-service-detail.service";
import { serviceIdParamsSchema } from "@/modules/services/validations/service.validation";

export async function getServiceByIdHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = serviceIdParamsSchema.parse(await params);
    const service = await getServiceDetailService({
      tenantId,
      serviceId: routeParams.id,
    });

    return ApiResponse.ok(service);
  } catch (error) {
    return handleServiceHttpError(error, "Error al obtener servicio:");
  }
}

