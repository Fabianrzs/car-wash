import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function generateOrderNumber(tenantId: string, tx?: TransactionClient): Promise<string> {
  const db = tx || prisma;
  const datePrefix = format(new Date(), "yyyyMMdd");
  const prefix = `ORD-${datePrefix}-`;

  // Count existing orders with this prefix to avoid string-sort issues and timezone bugs
  const count = await db.serviceOrder.count({
    where: {
      tenantId,
      orderNumber: { startsWith: prefix },
    },
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}
