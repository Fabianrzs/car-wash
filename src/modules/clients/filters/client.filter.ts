import { Prisma } from "@/generated/prisma/client";

interface BuildClientFilterInput {
  tenantId: string;
  search?: string;
  isFrequent?: boolean;
}

export function buildClientFilter({
  tenantId,
  search,
  isFrequent,
}: BuildClientFilterInput): Prisma.ClientWhereInput {
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

  return where;
}

