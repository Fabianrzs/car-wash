import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type PlansDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: PlansDatabase) {
  return database ?? prisma;
}

class PlanRepository extends BaseRepository<typeof prisma.plan> {
  findMany<T extends Prisma.PlanFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanFindManyArgs>,
    database?: PlansDatabase
  ) {
    return getDatabase(database).plan.findMany(args);
  }

  findUnique<T extends Prisma.PlanFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanFindUniqueArgs>,
    database?: PlansDatabase
  ) {
    return getDatabase(database).plan.findUnique(args);
  }

  create<T extends Prisma.PlanCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanCreateArgs>,
    database?: PlansDatabase
  ) {
    return getDatabase(database).plan.create(args);
  }

  update<T extends Prisma.PlanUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.PlanUpdateArgs>,
    database?: PlansDatabase
  ) {
    return getDatabase(database).plan.update(args);
  }
}

export const planRepository = new PlanRepository(prisma.plan);

