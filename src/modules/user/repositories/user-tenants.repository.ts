import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";

export type UserTenantsDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: UserTenantsDatabase) {
  return database ?? prisma;
}

class UserTenantsRepository {
  findManyTenantUsers<T extends Prisma.TenantUserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserFindManyArgs>,
    database?: UserTenantsDatabase
  ) {
    return getDatabase(database).tenantUser.findMany(args);
  }
}

export const userTenantsRepository = new UserTenantsRepository();

