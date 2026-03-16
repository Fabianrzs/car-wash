import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleClientHttpError,
} from "@/modules/clients/client.errors";
import { deleteClientService } from "@/modules/clients/services/delete-client.service";
import { clientIdParamsSchema } from "@/modules/clients/validations/client.validation";

export async function deleteClientHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = clientIdParamsSchema.parse(await params);
    const response = await deleteClientService({
      tenantId,
      clientId: routeParams.id,
    });

    return ApiResponse.ok(response);
  } catch (error) {
    return handleClientHttpError(error, "Error al eliminar cliente:");
  }
}

