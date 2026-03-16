import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleClientHttpError,
  unauthorizedResponse,
} from "@/modules/clients/client.errors";
import { getClientDetailService } from "@/modules/clients/services/get-client-detail.service";
import { clientIdParamsSchema } from "@/modules/clients/validations/client.validation";

export async function getClientByIdHandler(
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
    const client = await getClientDetailService({
      tenantId,
      clientId: routeParams.id,
    });

    return NextResponse.json(client);
  } catch (error) {
    return handleClientHttpError(error, "Error al obtener cliente:");
  }
}

