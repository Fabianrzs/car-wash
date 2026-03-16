import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
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
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
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

    return NextResponse.json(response);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al desasociar cliente:");
  }
}

