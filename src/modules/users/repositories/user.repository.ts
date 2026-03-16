import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export type UsersDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: UsersDatabase) {
  return database ?? prisma;
}

class UserRepository extends BaseRepository<typeof prisma.user> {
  findUnique<T extends Prisma.UserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
    database?: UsersDatabase
  ) {
    return getDatabase(database).user.findUnique(args);
  }

  findMany<T extends Prisma.UserFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindManyArgs>,
    database?: UsersDatabase
  ) {
    return getDatabase(database).user.findMany(args);
  }

  create<T extends Prisma.UserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>,
    database?: UsersDatabase
  ) {
    return getDatabase(database).user.create(args);
  }

  count<T extends Prisma.UserCountArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserCountArgs>,
    database?: UsersDatabase
  ) {
    return getDatabase(database).user.count(args);
  }
}

export const userRepository = new UserRepository(prisma.user);



