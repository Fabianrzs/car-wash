import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { requireTenant } from "@/lib/tenant";
import {
  handleClientHttpError,
  unauthorizedResponse,
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
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
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

    return NextResponse.json(result);
  } catch (error) {
    return handleClientHttpError(error, "Error al obtener historial del cliente:");
  }
}

