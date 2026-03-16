import { ClientModuleError } from "@/modules/clients/client.errors";
import { clientRepository } from "@/modules/clients/repositories/client.repository";

interface GetClientHistoryServiceInput {
  tenantId: string;
  clientId: string;
  page: number;
  take: number;
}

export async function getClientHistoryService({
  tenantId,
  clientId,
  page,
  take,
}: GetClientHistoryServiceInput) {
  const client = await clientRepository.findFirst({
    where: {
      id: clientId,
      tenantId,
    },
    select: { id: true },
  });

  if (!client) {
    throw new ClientModuleError("Cliente no encontrado", 404);
  }

  const where = {
    clientId,
    tenantId,
  };
  const skip = (page - 1) * take;

  const [orders, total] = await Promise.all([
    clientRepository.findManyServiceOrders({
      where,
      include: clientRepository.historyInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    clientRepository.countServiceOrders({ where }),
  ]);

  return {
    orders,
    total,
    pages: Math.ceil(total / take),
  };
}

