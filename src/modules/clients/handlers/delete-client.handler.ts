import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import {
  handleClientHttpError,
  unauthorizedResponse,
} from "@/modules/clients/client.errors";
import { deleteClientService } from "@/modules/clients/services/delete-client.service";
import { clientIdParamsSchema } from "@/modules/clients/validations/client.validation";

export async function deleteClientHandler(
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
    const response = await deleteClientService({
      tenantId,
      clientId: routeParams.id,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleClientHttpError(error, "Error al eliminar cliente:");
  }
}

