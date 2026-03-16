import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
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
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = vehicleSchema.parse(body);
    const vehicle = await updateVehicleService({
      tenantId,
      vehicleId: routeParams.id,
      data,
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al actualizar vehiculo:");
  }
}

