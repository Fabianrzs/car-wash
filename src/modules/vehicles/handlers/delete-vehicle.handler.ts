import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
} from "@/modules/vehicles/vehicle.errors";
import { deleteVehicleService } from "@/modules/vehicles/services/delete-vehicle.service";
import { vehicleIdParamsSchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function deleteVehicleHandler(
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
    const response = await deleteVehicleService({
      tenantId,
      vehicleId: routeParams.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al eliminar vehiculo:");
  }
}

