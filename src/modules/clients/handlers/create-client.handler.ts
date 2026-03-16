import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireActivePlan, requireTenant } from "@/lib/tenant";
import {
  handleClientHttpError,
  unauthorizedResponse,
} from "@/modules/clients/client.errors";
import { createClientService } from "@/modules/clients/services/create-client.service";
import { clientSchema } from "@/modules/clients/validations/client.validation";

export async function createClientHandler(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorizedResponse();
    }

    const { tenantId, tenant } = await requireTenant(request.headers);
    await requireActivePlan(tenantId, session.user.globalRole, tenant);

    const body = await request.json();
    const data = clientSchema.parse(body);
    const client = await createClientService({ tenantId, data });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return handleClientHttpError(error, "Error al crear cliente:");
  }
}

