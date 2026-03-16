import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireActivePlan, requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
} from "@/modules/vehicles/vehicle.errors";
import { createVehicleService } from "@/modules/vehicles/services/create-vehicle.service";
import { vehicleSchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function createVehicleHandler(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId, tenant } = await requireTenant(request.headers);
    await requireActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();
    const data = vehicleSchema.parse(body);
    const vehicle = await createVehicleService({ tenantId, data });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return handleVehicleHttpError(error, "Error al crear vehiculo:");
  }
}

