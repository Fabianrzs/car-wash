import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { deleteVehicleService } from "@/modules/vehicles/services/delete-vehicle.service";
import { vehicleIdParamsSchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function deleteVehicleHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const response = await deleteVehicleService({
      tenantId,
      vehicleId: routeParams.id,
    });

    return ApiResponse.ok(response);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al eliminar vehiculo:");
  }
}

