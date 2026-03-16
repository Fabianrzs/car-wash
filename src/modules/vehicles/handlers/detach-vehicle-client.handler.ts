import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { detachVehicleClientService } from "@/modules/vehicles/services/detach-vehicle-client.service";
import {
  vehicleClientQuerySchema,
  vehicleIdParamsSchema,
} from "@/modules/vehicles/validations/vehicle.validation";

export async function detachVehicleClientHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const query = vehicleClientQuerySchema.parse({
      clientId: searchParams.get("clientId") ?? undefined,
    });
    const response = await detachVehicleClientService({
      tenantId,
      vehicleId: routeParams.id,
      clientId: query.clientId,
    });

    return ApiResponse.ok(response);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al desasociar cliente:");
  }
}

