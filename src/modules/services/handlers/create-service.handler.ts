import { ApiResponse } from "@/lib/http/response";
import {
  requireAuth,
} from "@/middleware/auth.middleware";
import { ensureActivePlan } from "@/middleware/plan.middleware";
import {
  ensureManagementAccess,
  requireTenantContext,
} from "@/middleware/tenant.middleware";
import {
  handleServiceHttpError,
} from "@/modules/services/service.errors";
import { createServiceService } from "@/modules/services/services/create-service.service";
import { serviceTypeSchema } from "@/modules/services/validations/service.validation";

export async function createServiceHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureActivePlan(tenantId, session.user.globalRole, tenant);
    await ensureManagementAccess(
      session.user.id,
      tenantId,
      session.user.globalRole
    );

    const body = await request.json();
    const data = serviceTypeSchema.parse(body);
    const service = await createServiceService({ tenantId, data });

    return ApiResponse.created(service);
  } catch (error) {
    return handleServiceHttpError(error, "Error al crear servicio:");
  }
}

