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
import { deleteServiceService } from "@/modules/services/services/delete-service.service";
import { serviceIdParamsSchema } from "@/modules/services/validations/service.validation";

export async function deleteServiceHandler(
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
    const response = await deleteServiceService({
      tenantId,
      serviceId: routeParams.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceHttpError(error, "Error al desactivar servicio:");
  }
}

