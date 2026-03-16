import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export type ClientsDatabase = typeof prisma | Prisma.TransactionClient;

const clientListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  isFrequent: true,
  _count: {
    select: {
      vehicles: true,
      orders: true,
    },
  },
} as const satisfies Prisma.ClientSelect;

const clientDetailInclude = {
  vehicles: {
    include: {
      vehicle: {
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
          year: true,
          color: true,
          vehicleType: true,
        },
      },
    },
  },
  orders: {
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      vehicle: {
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          serviceType: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  },
} as const satisfies Prisma.ClientInclude;

const clientHistoryInclude = {
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      vehicleType: true,
    },
  },
  items: {
    include: {
      serviceType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const satisfies Prisma.ServiceOrderInclude;

export type ClientListItem = Prisma.ClientGetPayload<{
  select: typeof clientListSelect;
}>;
export type ClientDetail = Prisma.ClientGetPayload<{
  include: typeof clientDetailInclude;
}>;
export type ClientHistoryOrder = Prisma.ServiceOrderGetPayload<{
  include: typeof clientHistoryInclude;
}>;

function getDatabase(database?: ClientsDatabase) {
  return database ?? prisma;
}

class ClientRepository extends BaseRepository<typeof prisma.client> {
  readonly listSelect = clientListSelect;
  readonly detailInclude = clientDetailInclude;
  readonly historyInclude = clientHistoryInclude;
  readonly activeOrderStatuses = [OrderStatus.PENDING, OrderStatus.IN_PROGRESS] as const;

  findMany(args: Prisma.ClientFindManyArgs, database?: ClientsDatabase) {
    return getDatabase(database).client.findMany(args);
  }

  findFirst(args: Prisma.ClientFindFirstArgs, database?: ClientsDatabase) {
    return getDatabase(database).client.findFirst(args);
  }

  create(args: Prisma.ClientCreateArgs, database?: ClientsDatabase) {
    return getDatabase(database).client.create(args);
  }

  update(args: Prisma.ClientUpdateArgs, database?: ClientsDatabase) {
    return getDatabase(database).client.update(args);
  }

  delete(args: Prisma.ClientDeleteArgs, database?: ClientsDatabase) {
    return getDatabase(database).client.delete(args);
  }

  count(args: Prisma.ClientCountArgs, database?: ClientsDatabase) {
    return getDatabase(database).client.count(args);
  }

  findFirstVehicle(args: Prisma.VehicleFindFirstArgs, database?: ClientsDatabase) {
    return getDatabase(database).vehicle.findFirst(args);
  }

  createVehicle(args: Prisma.VehicleCreateArgs, database?: ClientsDatabase) {
    return getDatabase(database).vehicle.create(args);
  }

  createClientVehicle(
    args: Prisma.ClientVehicleCreateArgs,
    database?: ClientsDatabase
  ) {
    return getDatabase(database).clientVehicle.create(args);
  }

  findManyServiceOrders(
    args: Prisma.ServiceOrderFindManyArgs,
    database?: ClientsDatabase
  ) {
    return getDatabase(database).serviceOrder.findMany(args);
  }

  countServiceOrders(
    args: Prisma.ServiceOrderCountArgs,
    database?: ClientsDatabase
  ) {
    return getDatabase(database).serviceOrder.count(args);
  }
}

export const clientRepository = new ClientRepository(prisma.client);


