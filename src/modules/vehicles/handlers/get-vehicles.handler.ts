import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { requireTenant } from "@/lib/tenant";
import {
  handleVehicleHttpError,
  unauthorizedResponse,
} from "@/modules/vehicles/vehicle.errors";
import { listVehiclesService } from "@/modules/vehicles/services/list-vehicles.service";
import { listVehiclesQuerySchema } from "@/modules/vehicles/validations/vehicle.validation";

export async function getVehiclesHandler(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const { searchParams } = new URL(request.url);
    const query = listVehiclesQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await listVehiclesService({
      tenantId,
      page: query.page,
      take: query.limit ?? ITEMS_PER_PAGE,
      search: query.search,
      clientId: query.clientId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleVehicleHttpError(error, "Error al obtener vehiculos:");
  }
}

