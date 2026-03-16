import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  requireActivePlan,
  requireTenant,
  requireTenantMember,
} from "@/lib/tenant";
import {
  forbiddenResponse,
  handleServiceHttpError,
  unauthorizedResponse,
} from "@/modules/services/service.errors";
import { createServiceService } from "@/modules/services/services/create-service.service";
import { serviceTypeSchema } from "@/modules/services/validations/service.validation";

export async function createServiceHandler(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId, tenant } = await requireTenant(request.headers);
    await requireActivePlan(tenantId, session.user.globalRole, tenant);
    const tenantUser = await requireTenantMember(
      session.user.id,
      tenantId,
      session.user.globalRole
    );

    if (tenantUser.role === "EMPLOYEE") {
      return forbiddenResponse();
    }

    const body = await request.json();
    const data = serviceTypeSchema.parse(body);
    const service = await createServiceService({ tenantId, data });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return handleServiceHttpError(error, "Error al crear servicio:");
  }
}

