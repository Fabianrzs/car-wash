import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { updateVehicleService } from "@/modules/vehicles/services/update-vehicle.service";
import {
  vehicleIdParamsSchema,
  vehicleSchema,
} from "@/modules/vehicles/validations/vehicle.validation";

export async function updateVehicleHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = vehicleSchema.parse(body);
    const vehicle = await updateVehicleService({
      tenantId,
      vehicleId: routeParams.id,
      data,
    });

    return ApiResponse.ok(vehicle);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al actualizar vehiculo:");
  }
}

