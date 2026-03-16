import { ApiResponse } from "@/lib/http/response";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleClientHttpError,
} from "@/modules/clients/client.errors";
import { getClientHistoryService } from "@/modules/clients/services/get-client-history.service";
import {
  clientHistoryQuerySchema,
  clientIdParamsSchema,
} from "@/modules/clients/validations/client.validation";

export async function getClientHistoryHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const routeParams = clientIdParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const query = clientHistoryQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
    });

    const result = await getClientHistoryService({
      tenantId,
      clientId: routeParams.id,
      page: query.page,
      take: ITEMS_PER_PAGE,
    });

    return ApiResponse.ok(result);
  } catch (error) {
    return handleClientHttpError(error, "Error al obtener historial del cliente:");
  }
}

