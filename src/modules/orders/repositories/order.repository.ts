import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type OrdersDatabase = typeof prisma | Prisma.TransactionClient;

const listInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
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
  assignedTo: {
    select: { id: true, name: true },
  },
} as const satisfies Prisma.ServiceOrderInclude;

const detailInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
  },
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
  items: {
    include: {
      serviceType: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
    },
  },
} as const satisfies Prisma.ServiceOrderInclude;

const mutateInclude = {
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
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

const assignInclude = {
  assignedTo: { select: { id: true, name: true } },
  client: { select: { id: true, firstName: true, lastName: true, phone: true } },
  vehicle: { select: { id: true, plate: true, brand: true, model: true } },
} as const satisfies Prisma.ServiceOrderInclude;

const statusSelect = {
  id: true,
  status: true,
  orderNumber: true,
  assignedTo: { select: { id: true, email: true } },
  client: { select: { firstName: true, lastName: true } },
  tenant: { select: { name: true } },
} as const satisfies Prisma.ServiceOrderSelect;

function getDatabase(database?: OrdersDatabase) {
  return database ?? prisma;
}

class OrderRepository extends BaseRepository<typeof prisma.serviceOrder> {
  readonly listInclude = listInclude;
  readonly detailInclude = detailInclude;
  readonly mutateInclude = mutateInclude;
  readonly assignInclude = assignInclude;
  readonly statusSelect = statusSelect;

  findMany<T extends Prisma.ServiceOrderFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderFindManyArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.findMany(args);
  }

  findFirst<T extends Prisma.ServiceOrderFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderFindFirstArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.findFirst(args);
  }

  findLatestOrderNumberByPrefix(
    tenantId: string,
    prefix: string,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.findFirst({
      where: {
        tenantId,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { createdAt: "desc" },
      select: { orderNumber: true },
    });
  }

  create<T extends Prisma.ServiceOrderCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderCreateArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.create(args);
  }

  update<T extends Prisma.ServiceOrderUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderUpdateArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.update(args);
  }

  count<T extends Prisma.ServiceOrderCountArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderCountArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.count(args);
  }

  aggregate<T extends Prisma.ServiceOrderAggregateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceOrderAggregateArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceOrder.aggregate(args);
  }

  findManyServiceTypes<T extends Prisma.ServiceTypeFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ServiceTypeFindManyArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).serviceType.findMany(args);
  }

  findFirstClientVehicle<T extends Prisma.ClientVehicleFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.ClientVehicleFindFirstArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).clientVehicle.findFirst(args);
  }

  findFirstClient<T extends Prisma.ClientFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.ClientFindFirstArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).client.findFirst(args);
  }

  findFirstVehicle<T extends Prisma.VehicleFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.VehicleFindFirstArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).vehicle.findFirst(args);
  }

  findFirstTenantUser<T extends Prisma.TenantUserFindFirstArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserFindFirstArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).tenantUser.findFirst(args);
  }

  findManyTenantUsers<T extends Prisma.TenantUserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.TenantUserFindManyArgs>,
    database?: OrdersDatabase
  ) {
    return getDatabase(database).tenantUser.findMany(args);
  }
}

export const orderRepository = new OrderRepository(prisma.serviceOrder);


