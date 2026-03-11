import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function generateOrderNumber(tenantId: string, tx?: TransactionClient): Promise<string> {
  const db = tx || prisma;
  const datePrefix = format(new Date(), "yyyyMMdd");
  const prefix = `ORD-${datePrefix}-`;

  // Get the most recently created order for this tenant with today's prefix.
  // Sorting by createdAt desc is correct regardless of gaps in sequence
  // (deleted orders, failed inserts, etc.).
  const lastOrder = await db.serviceOrder.findFirst({
    where: { tenantId, orderNumber: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop() ?? "0", 10);
    if (!isNaN(lastSeq) && lastSeq > 0) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(3, "0")}`;
}
