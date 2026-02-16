import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function generateOrderNumber(tenantId: string): Promise<string> {
  const today = new Date();
  const datePrefix = format(today, "yyyyMMdd");

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const lastOrder = await prisma.serviceOrder.findFirst({
    where: {
      tenantId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  let sequence = 1;

  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    const lastSequence = parseInt(parts[2], 10);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  const sequenceStr = sequence.toString().padStart(3, "0");

  return `ORD-${datePrefix}-${sequenceStr}`;
}
