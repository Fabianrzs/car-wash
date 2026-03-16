import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { getVehicleDetailService } from "@/modules/vehicles/services/get-vehicle-detail.service";
import { vehicleIdParamsSchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function getVehicleByIdHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const vehicle = await getVehicleDetailService({
      tenantId,
      vehicleId: routeParams.id,
    });

    return ApiResponse.ok(vehicle);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al obtener vehiculo:");
  }
}

