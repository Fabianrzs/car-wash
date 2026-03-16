import { ApiResponse } from "@/lib/http/response";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import {
  handleClientHttpError,
} from "@/modules/clients/client.errors";
import { listClientsService } from "@/modules/clients/services/list-clients.service";
import { listClientsQuerySchema } from "@/modules/clients/validations/client.validation";

export async function getClientsHandler(request: Request) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    const { searchParams } = new URL(request.url);
    const query = listClientsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      frequent: searchParams.get("frequent") ?? undefined,
      isFrequent: searchParams.get("isFrequent") ?? undefined,
    });

    const result = await listClientsService({
      tenantId,
      page: query.page,
      take: query.limit ?? ITEMS_PER_PAGE,
      search: query.search,
      isFrequent: query.isFrequent,
    });

    return ApiResponse.ok(result);
  } catch (error) {
    return handleClientHttpError(error, "Error al obtener clientes:");
  }
}

