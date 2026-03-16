import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
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
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const routeParams = vehicleIdParamsSchema.parse(await params);
    const body = vehicleClientBodySchema.parse(await request.json());
    const junction = await attachVehicleClientService({
      tenantId,
      vehicleId: routeParams.id,
      clientId: body.clientId,
    });

    return NextResponse.json(junction, { status: 201 });
  } catch (error) {
    return handleVehicleHttpError(error, "Error al asociar cliente:");
  }
}

