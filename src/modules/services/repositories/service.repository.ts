import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ServicesDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: ServicesDatabase) {
  return database ?? prisma;
}

export const serviceRepository = {
  findMany(args: Prisma.ServiceTypeFindManyArgs, database?: ServicesDatabase) {
    return getDatabase(database).serviceType.findMany(args);
  },

  findFirst(args: Prisma.ServiceTypeFindFirstArgs, database?: ServicesDatabase) {
    return getDatabase(database).serviceType.findFirst(args);
  },

  create(args: Prisma.ServiceTypeCreateArgs, database?: ServicesDatabase) {
    return getDatabase(database).serviceType.create(args);
  },

  update(args: Prisma.ServiceTypeUpdateArgs, database?: ServicesDatabase) {
    return getDatabase(database).serviceType.update(args);
  },

  delete(args: Prisma.ServiceTypeDeleteArgs, database?: ServicesDatabase) {
    return getDatabase(database).serviceType.delete(args);
  },

  count(args: Prisma.ServiceTypeCountArgs, database?: ServicesDatabase) {
    return getDatabase(database).serviceType.count(args);
  },
};

