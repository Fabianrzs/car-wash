import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";
import { InvoiceStatus, type Prisma } from "@/generated/prisma/client";

export async function getInvoicesService(tenantId: string) {
  return tenantModuleRepository.findManyInvoices({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { plan: true },
  });
}

export async function getInvoiceByIdService(tenantId: string, invoiceId: string) {
  return tenantModuleRepository.findInvoiceUnique({
    where: { id: invoiceId, tenantId },
    include: { plan: true, tenant: { select: { name: true, slug: true, email: true } } },
  });
}

export async function getInvoiceDetailByIdService(tenantId: string, invoiceId: string) {
  return tenantModuleRepository.findInvoiceUnique({
    where: { id: invoiceId, tenantId },
    include: {
      plan: true,
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      tenant: {
        select: { name: true, slug: true, email: true, phone: true, address: true },
      },
    },
  });
}

export async function getInvoicesPageService(
  tenantId: string,
  input: { status?: string | null; page: number; limit: number }
) {
  const where: Prisma.InvoiceWhereInput = { tenantId };

  if (input.status && Object.values(InvoiceStatus).includes(input.status as InvoiceStatus)) {
    where.status = input.status as InvoiceStatus;
  }

  const [invoices, total] = await Promise.all([
    tenantModuleRepository.findManyInvoices({
      where,
      include: {
        plan: { select: { id: true, name: true } },
        items: true,
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    tenantModuleRepository.countInvoices({ where }),
  ]);

  return {
    invoices,
    total,
    pages: Math.ceil(total / input.limit),
  };
}

