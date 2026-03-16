import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type VehiclesDatabase = typeof prisma | Prisma.TransactionClient;

const vehicleListInclude = {
  clients: {
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  },
} as const satisfies Prisma.VehicleInclude;

const vehicleDetailInclude = {
  clients: {
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
    },
  },
} as const satisfies Prisma.VehicleInclude;

const vehicleMutationInclude = {
  clients: {
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} as const satisfies Prisma.VehicleInclude;

function getDatabase(database?: VehiclesDatabase) {
  return database ?? prisma;
}

export const vehicleRepository = {
  listInclude: vehicleListInclude,
  detailInclude: vehicleDetailInclude,
  mutationInclude: vehicleMutationInclude,
  activeOrderStatuses: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const,

  withTransaction<T>(callback: (database: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  },

  findMany(args: Prisma.VehicleFindManyArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.findMany(args);
  },

  findFirst(args: Prisma.VehicleFindFirstArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.findFirst(args);
  },

  create(args: Prisma.VehicleCreateArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.create(args);
  },

  update(args: Prisma.VehicleUpdateArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.update(args);
  },

  delete(args: Prisma.VehicleDeleteArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.delete(args);
  },

  count(args: Prisma.VehicleCountArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.count(args);
  },

  findManyClients(args: Prisma.ClientFindManyArgs, database?: VehiclesDatabase) {
    return getDatabase(database).client.findMany(args);
  },

  findFirstClient(args: Prisma.ClientFindFirstArgs, database?: VehiclesDatabase) {
    return getDatabase(database).client.findFirst(args);
  },

  createManyClientVehicles(
    args: Prisma.ClientVehicleCreateManyArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).clientVehicle.createMany(args);
  },

  deleteManyClientVehicles(
    args: Prisma.ClientVehicleDeleteManyArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).clientVehicle.deleteMany(args);
  },

  upsertClientVehicle(
    args: Prisma.ClientVehicleUpsertArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).clientVehicle.upsert(args);
  },

  countServiceOrders(
    args: Prisma.ServiceOrderCountArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).serviceOrder.count(args);
  },
};

