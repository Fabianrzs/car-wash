import { ApiResponse } from "@/lib/http/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleClientHttpError,
} from "@/modules/clients/client.errors";
import { getClientDetailService } from "@/modules/clients/services/get-client-detail.service";
import { clientIdParamsSchema } from "@/modules/clients/validations/client.validation";

export async function getClientByIdHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = clientIdParamsSchema.parse(await params);
    const client = await getClientDetailService({
      tenantId,
      clientId: routeParams.id,
    });

    return ApiResponse.ok(client);
  } catch (error) {
    return handleClientHttpError(error, "Error al obtener cliente:");
  }
}

