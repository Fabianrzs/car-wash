import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleServiceHttpError,
  unauthorizedResponse,
} from "@/modules/services/service.errors";
import { getServiceDetailService } from "@/modules/services/services/get-service-detail.service";
import { serviceIdParamsSchema } from "@/modules/services/validations/service.validation";

export async function getServiceByIdHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const routeParams = serviceIdParamsSchema.parse(await params);
    const service = await getServiceDetailService({
      tenantId,
      serviceId: routeParams.id,
    });

    return NextResponse.json(service);
  } catch (error) {
    return handleServiceHttpError(error, "Error al obtener servicio:");
  }
}

