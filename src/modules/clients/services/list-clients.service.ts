import { Prisma } from "@/generated/prisma/client";
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
  const where: Prisma.ClientWhereInput = { tenantId };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
    ];
  }

  if (typeof isFrequent === "boolean") {
    where.isFrequent = isFrequent;
  }

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

