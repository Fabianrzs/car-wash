import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { ensureActivePlan } from "@/middleware/plan.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleClientHttpError,
} from "@/modules/clients/client.errors";
import { createClientService } from "@/modules/clients/services/create-client.service";
import { clientSchema } from "@/modules/clients/validations/client.validation";

export async function createClientHandler(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();
    const data = clientSchema.parse(body);
    const client = await createClientService({ tenantId, data });

    return ApiResponse.created(client);
  } catch (error) {
    return handleClientHttpError(error, "Error al crear cliente:");
  }
}

