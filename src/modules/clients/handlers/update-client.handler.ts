import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleClientHttpError,
} from "@/modules/clients/client.errors";
import { updateClientService } from "@/modules/clients/services/update-client.service";
import {
  clientIdParamsSchema,
  clientSchema,
} from "@/modules/clients/validations/client.validation";

export async function updateClientHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = clientIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = clientSchema.parse(body);
    const client = await updateClientService({
      tenantId,
      clientId: routeParams.id,
      data,
    });

    return ApiResponse.ok(client);
  } catch (error) {
    return handleClientHttpError(error, "Error al actualizar cliente:");
  }
}

