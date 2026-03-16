import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleServiceHttpError,
} from "@/modules/services/service.errors";
import { listServicesService } from "@/modules/services/services/list-services.service";
import { listServicesQuerySchema } from "@/modules/services/validations/service.validation";

export async function getServicesHandler(request: Request) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const { searchParams } = new URL(request.url);
    const query = listServicesQuerySchema.parse({
      active: searchParams.get("active") ?? undefined,
    });

    const services = await listServicesService({
      tenantId,
      active: query.active,
    });

    return ApiResponse.ok(services);
  } catch (error) {
    return handleServiceHttpError(error, "Error al obtener servicios:");
  }
}

