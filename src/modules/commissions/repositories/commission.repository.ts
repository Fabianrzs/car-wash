import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";

export type CommissionsDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: CommissionsDatabase) {
  return database ?? prisma;
}

class CommissionRepository {
  transaction<T>(callback: (database: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  findEarningFirst<T extends Prisma.WasherEarningFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherEarningFindFirstArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerEarning.findFirst(args);
  }

  findManyEarnings<T extends Prisma.WasherEarningFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherEarningFindManyArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerEarning.findMany(args);
  }

  createEarning<T extends Prisma.WasherEarningCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherEarningCreateArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerEarning.create(args);
  }

  updateManyEarnings<T extends Prisma.WasherEarningUpdateManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherEarningUpdateManyArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerEarning.updateMany(args);
  }

  aggregateEarnings<T extends Prisma.WasherEarningAggregateArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherEarningAggregateArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerEarning.aggregate(args);
  }

  findManyPayouts<T extends Prisma.WasherPayoutFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherPayoutFindManyArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerPayout.findMany(args);
  }

  createPayout<T extends Prisma.WasherPayoutCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherPayoutCreateArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerPayout.create(args);
  }

  findPayoutFirst<T extends Prisma.WasherPayoutFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherPayoutFindFirstArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerPayout.findFirst(args);
  }

  deletePayout<T extends Prisma.WasherPayoutDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherPayoutDeleteArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).washerPayout.delete(args);
  }

  findTenantFirst<T extends Prisma.TenantFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantFindFirstArgs>,
    database?: CommissionsDatabase
  ) {
    return getDatabase(database).tenant.findFirst(args);
  }
}

export const commissionRepository = new CommissionRepository();
