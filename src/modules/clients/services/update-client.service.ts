import { ClientModuleError } from "@/modules/clients/client.errors";
import { clientRepository } from "@/modules/clients/repositories/client.repository";
import { buildClientWritePayload } from "@/modules/clients/client.utils";
import { type UpdateClientInput } from "@/modules/clients/validations/client.validation";

interface UpdateClientServiceInput {
  tenantId: string;
  clientId: string;
  data: UpdateClientInput;
}

export async function updateClientService({
  tenantId,
  clientId,
  data,
}: UpdateClientServiceInput) {
  const existingClient = await clientRepository.findFirst({
    where: {
      id: clientId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existingClient) {
    throw new ClientModuleError("Cliente no encontrado", 404);
  }

  const clientData = buildClientWritePayload(data);

  if (clientData.email) {
    const duplicatedEmail = await clientRepository.findFirst({
      where: {
        tenantId,
        email: clientData.email,
        NOT: { id: clientId },
      },
      select: { id: true },
    });

    if (duplicatedEmail) {
      throw new ClientModuleError("Ya existe un cliente con ese email", 400);
    }
  }

  return clientRepository.update({
    where: { id: clientId },
    data: clientData,
  });
}

