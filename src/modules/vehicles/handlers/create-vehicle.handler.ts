import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { ensureActivePlan } from "@/middleware/plan.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleVehicleHttpError,
} from "@/modules/vehicles/vehicle.errors";
import { createVehicleService } from "@/modules/vehicles/services/create-vehicle.service";
import { vehicleSchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function createVehicleHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();
    const data = vehicleSchema.parse(body);
    const vehicle = await createVehicleService({ tenantId, data });

    return ApiResponse.created(vehicle);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al crear vehiculo:");
  }
}

