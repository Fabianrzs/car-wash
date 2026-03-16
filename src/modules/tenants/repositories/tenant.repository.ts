import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type TenantsDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: TenantsDatabase) {
  return database ?? prisma;
}

class TenantRepository extends BaseRepository<typeof prisma.tenant> {
  findMany<T extends Prisma.TenantFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindManyArgs>,
    database?: TenantsDatabase
  ) {
    return getDatabase(database).tenant.findMany(args);
  }

  findUnique<T extends Prisma.TenantFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindUniqueArgs>,
    database?: TenantsDatabase
  ) {
    return getDatabase(database).tenant.findUnique(args);
  }

  create<T extends Prisma.TenantCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantCreateArgs>,
    database?: TenantsDatabase
  ) {
    return getDatabase(database).tenant.create(args);
  }

  update<T extends Prisma.TenantUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUpdateArgs>,
    database?: TenantsDatabase
  ) {
    return getDatabase(database).tenant.update(args);
  }

  count<T extends Prisma.TenantCountArgs>(
    args?: Prisma.SelectSubset<T, Prisma.TenantCountArgs>,
    database?: TenantsDatabase
  ) {
    return getDatabase(database).tenant.count(args);
  }

  createTenantUser<T extends Prisma.TenantUserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserCreateArgs>,
    database?: TenantsDatabase
  ) {
    return getDatabase(database).tenantUser.create(args);
  }
}

export const tenantRepository = new TenantRepository(prisma.tenant);



