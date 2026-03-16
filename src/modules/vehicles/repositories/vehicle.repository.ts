import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export type VehiclesDatabase = typeof prisma | Prisma.TransactionClient;

const vehicleClientBaseSelect = {
  id: true,
  firstName: true,
  lastName: true,
} as const;

const vehicleListClientSelect = {
  ...vehicleClientBaseSelect,
  phone: true,
} as const;

const vehicleDetailClientSelect = {
  ...vehicleListClientSelect,
  email: true,
} as const;

function createVehicleClientsInclude<TSelect extends Prisma.ClientSelect>(
  clientSelect: TSelect
) {
  return {
    clients: {
      include: {
        client: {
          select: clientSelect,
        },
      },
    },
  } as const satisfies Prisma.VehicleInclude;
}

const vehicleListInclude = createVehicleClientsInclude(vehicleListClientSelect);
const vehicleDetailInclude = createVehicleClientsInclude(vehicleDetailClientSelect);
const vehicleMutationInclude = createVehicleClientsInclude(vehicleClientBaseSelect);

function getDatabase(database?: VehiclesDatabase) {
  return database ?? prisma;
}

class VehicleRepository extends BaseRepository<typeof prisma.vehicle> {
  readonly listInclude = vehicleListInclude;
  readonly detailInclude = vehicleDetailInclude;
  readonly mutationInclude = vehicleMutationInclude;
  readonly activeOrderStatuses = [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const;

  findMany(args: Prisma.VehicleFindManyArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.findMany(args);
  }

  findFirst(args: Prisma.VehicleFindFirstArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.findFirst(args);
  }

  findTenantVehicleById(
    tenantId: string,
    vehicleId: string,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).vehicle.findFirst({
      where: { id: vehicleId, tenantId },
      select: { id: true },
    });
  }

  create(args: Prisma.VehicleCreateArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.create(args);
  }

  update(args: Prisma.VehicleUpdateArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.update(args);
  }

  delete(args: Prisma.VehicleDeleteArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.delete(args);
  }

  count(args: Prisma.VehicleCountArgs, database?: VehiclesDatabase) {
    return getDatabase(database).vehicle.count(args);
  }

  findManyClients(args: Prisma.ClientFindManyArgs, database?: VehiclesDatabase) {
    return getDatabase(database).client.findMany(args);
  }

  findFirstClient(args: Prisma.ClientFindFirstArgs, database?: VehiclesDatabase) {
    return getDatabase(database).client.findFirst(args);
  }

  findTenantClientById(
    tenantId: string,
    clientId: string,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).client.findFirst({
      where: { id: clientId, tenantId },
      select: { id: true },
    });
  }

  createManyClientVehicles(
    args: Prisma.ClientVehicleCreateManyArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).clientVehicle.createMany(args);
  }

  deleteManyClientVehicles(
    args: Prisma.ClientVehicleDeleteManyArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).clientVehicle.deleteMany(args);
  }

  upsertClientVehicle(
    args: Prisma.ClientVehicleUpsertArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).clientVehicle.upsert(args);
  }

  countServiceOrders(
    args: Prisma.ServiceOrderCountArgs,
    database?: VehiclesDatabase
  ) {
    return getDatabase(database).serviceOrder.count(args);
  }
}

export const vehicleRepository = new VehicleRepository(prisma.vehicle);

