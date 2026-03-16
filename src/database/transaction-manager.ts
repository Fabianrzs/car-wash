import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/database/prisma";

export async function runTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback);
}

