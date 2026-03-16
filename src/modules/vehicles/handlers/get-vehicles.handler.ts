import { ApiResponse } from "@/lib/http/response";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { listVehiclesService } from "@/modules/vehicles/services/list-vehicles.service";
import { listVehiclesQuerySchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function getVehiclesHandler(request: Request) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const { searchParams } = new URL(request.url);
    const query = listVehiclesQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await listVehiclesService({
      tenantId,
      page: query.page,
      take: query.limit ?? ITEMS_PER_PAGE,
      search: query.search,
      clientId: query.clientId,
    });

    return ApiResponse.ok(result);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al obtener vehiculos:");
  }
}

