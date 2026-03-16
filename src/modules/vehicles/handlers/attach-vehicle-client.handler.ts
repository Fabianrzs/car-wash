import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { attachVehicleClientService } from "@/modules/vehicles/services/attach-vehicle-client.service";
import {
  vehicleClientBodySchema,
  vehicleIdParamsSchema,
} from "@/modules/vehicles/validations/vehicle.validation";

export async function attachVehicleClientHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const body = vehicleClientBodySchema.parse(await request.json());
    const junction = await attachVehicleClientService({
      tenantId,
      vehicleId: routeParams.id,
      clientId: body.clientId,
    });

    return ApiResponse.created(junction);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al asociar cliente:");
  }
}

