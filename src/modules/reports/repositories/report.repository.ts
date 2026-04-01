import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type ReportsDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: ReportsDatabase) {
  return database ?? prisma;
}

class ReportRepository extends BaseRepository<typeof prisma.serviceOrder> {
  aggregateOrders<T extends Prisma.ServiceOrderAggregateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderAggregateArgs>,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).serviceOrder.aggregate(args);
  }

  groupOrdersByStatus(
    args: Prisma.ServiceOrderGroupByArgs,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).serviceOrder.groupBy(args as never);
  }

  findOrders<T extends Prisma.ServiceOrderFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderFindManyArgs>,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).serviceOrder.findMany(args);
  }

  groupOrderItems(
    args: Prisma.OrderItemGroupByArgs,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).orderItem.groupBy(args as never);
  }

  findServiceTypes<T extends Prisma.ServiceTypeFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceTypeFindManyArgs>,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).serviceType.findMany(args);
  }

  aggregatePayouts<T extends Prisma.WasherPayoutAggregateArgs>(
    args: Prisma.SelectSubset<T, Prisma.WasherPayoutAggregateArgs>,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).washerPayout.aggregate(args);
  }

  findUsers<T extends Prisma.UserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
    database?: ReportsDatabase
  ) {
    return getDatabase(database).user.findMany(args);
  }
}

export const reportRepository = new ReportRepository(prisma.serviceOrder);



