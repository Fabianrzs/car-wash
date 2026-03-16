import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
} from "@/modules/vehicles/vehicle.errors";
import { getVehicleDetailService } from "@/modules/vehicles/services/get-vehicle-detail.service";
import { vehicleIdParamsSchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function getVehicleByIdHandler(
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
    const vehicle = await getVehicleDetailService({
      tenantId,
      vehicleId: routeParams.id,
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al obtener vehiculo:");
  }
}

