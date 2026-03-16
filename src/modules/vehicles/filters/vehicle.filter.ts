import { Prisma } from "@/generated/prisma/client";

interface BuildVehicleFilterInput {
  tenantId: string;
  search?: string;
  clientId?: string;
}

export function buildVehicleFilter({
  tenantId,
  search,
  clientId,
}: BuildVehicleFilterInput): Prisma.VehicleWhereInput {
  const where: Prisma.VehicleWhereInput = { tenantId };

  if (search) {
    where.plate = { contains: search, mode: Prisma.QueryMode.insensitive };
  }

  if (clientId) {
    where.clients = { some: { clientId } };
  }

  return where;
}

