import { prisma } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";

export type InviteDatabase = typeof prisma | Prisma.TransactionClient;

function getDatabase(database?: InviteDatabase) {
  return database ?? prisma;
}

class InviteRepository {
  findInvitationByToken<T extends Prisma.InvitationFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.InvitationFindUniqueArgs>,
    database?: InviteDatabase
  ) {
    return getDatabase(database).invitation.findUnique(args);
  }
}

export const inviteRepository = new InviteRepository();

