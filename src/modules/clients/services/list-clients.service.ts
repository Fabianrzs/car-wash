import { buildClientFilter } from "@/modules/clients/filters/client.filter";
import { clientRepository } from "@/modules/clients/repositories/client.repository";

interface ListClientsServiceInput {
  tenantId: string;
  page: number;
  take: number;
  search: string;
  isFrequent?: boolean;
}

export async function listClientsService({
  tenantId,
  page,
  take,
  search,
  isFrequent,
}: ListClientsServiceInput) {
  const where = buildClientFilter({
    tenantId,
    search,
    isFrequent,
  });

  const skip = (page - 1) * take;

  const [clients, total] = await Promise.all([
    clientRepository.findMany({
      where,
      skip,
      take,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: clientRepository.listSelect,
    }),
    clientRepository.count({ where }),
  ]);

  return {
    clients,
    total,
    pages: Math.ceil(total / take),
  };
}

