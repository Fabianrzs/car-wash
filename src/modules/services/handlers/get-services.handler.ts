import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleServiceHttpError,
  unauthorizedResponse,
} from "@/modules/services/service.errors";
import { listServicesService } from "@/modules/services/services/list-services.service";
import { listServicesQuerySchema } from "@/modules/services/validations/service.validation";

export async function getServicesHandler(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const { searchParams } = new URL(request.url);
    const query = listServicesQuerySchema.parse({
      active: searchParams.get("active") ?? undefined,
    });

    const services = await listServicesService({
      tenantId,
      active: query.active,
    });

    return NextResponse.json(services);
  } catch (error) {
    return handleServiceHttpError(error, "Error al obtener servicios:");
  }
}

