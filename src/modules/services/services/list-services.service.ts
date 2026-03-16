import { Prisma } from "@/generated/prisma/client";
import { serviceRepository } from "@/modules/services/repositories/service.repository";

interface ListServicesServiceInput {
  tenantId: string;
  active?: boolean;
}

export async function listServicesService({
  tenantId,
  active,
}: ListServicesServiceInput) {
  const where: Prisma.ServiceTypeWhereInput = { tenantId };

  if (active === true) {
    where.isActive = true;
  }

  return serviceRepository.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

