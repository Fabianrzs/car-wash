import { prisma } from "@/database/prisma";

export async function getInvoicesService(tenantId: string) {
  return prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { plan: true },
  });
}

export async function getInvoiceByIdService(tenantId: string, invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: { plan: true, tenant: { select: { name: true, slug: true, email: true } } },
  });
}

