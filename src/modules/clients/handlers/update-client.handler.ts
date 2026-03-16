import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleClientHttpError,
  unauthorizedResponse,
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
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId } = await requireTenant(request.headers);
    const routeParams = clientIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = clientSchema.parse(body);
    const client = await updateClientService({
      tenantId,
      clientId: routeParams.id,
      data,
    });

    return NextResponse.json(client);
  } catch (error) {
    return handleClientHttpError(error, "Error al actualizar cliente:");
  }
}

