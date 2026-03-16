import { ClientModuleError } from "@/modules/clients/client.errors";
import { clientRepository } from "@/modules/clients/repositories/client.repository";

interface GetClientDetailServiceInput {
  tenantId: string;
  clientId: string;
}

export async function getClientDetailService({
  tenantId,
  clientId,
}: GetClientDetailServiceInput) {
  const client = await clientRepository.findFirst({
    where: {
      id: clientId,
      tenantId,
    },
    include: clientRepository.detailInclude,
  });

  if (!client) {
    throw new ClientModuleError("Cliente no encontrado", 404);
  }

  return client;
}

