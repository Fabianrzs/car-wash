import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  requireTenant,
  requireTenantMember,
} from "@/lib/tenant";
import {
  forbiddenResponse,
  handleServiceHttpError,
  unauthorizedResponse,
} from "@/modules/services/service.errors";
import { updateServiceService } from "@/modules/services/services/update-service.service";
import {
  serviceIdParamsSchema,
  serviceTypeSchema,
} from "@/modules/services/validations/service.validation";

export async function updateServiceHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(
      session.user.id,
      tenantId,
      session.user.globalRole
    );

    if (tenantUser.role === "EMPLOYEE") {
      return forbiddenResponse();
    }

    const routeParams = serviceIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = serviceTypeSchema.parse(body);
    const service = await updateServiceService({
      tenantId,
      serviceId: routeParams.id,
      data,
    });

    return NextResponse.json(service);
  } catch (error) {
    return handleServiceHttpError(error, "Error al actualizar servicio:");
  }
}

