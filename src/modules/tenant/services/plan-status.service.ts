import { getTenantPlanStatus } from "@/lib";
import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

export async function getTenantPlanStatusService(tenantId: string) {
  const tenant = await tenantModuleRepository.findTenantUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    throw new Error("Tenant no encontrado");
  }

  const pendingInvoice = await tenantModuleRepository.findInvoiceFirst({
    where: {
      tenantId,
      status: { in: ["PENDING", "OVERDUE"] },
    },
    orderBy: { dueDate: "asc" },
    select: { id: true, dueDate: true },
  });

  return getTenantPlanStatus(tenant, pendingInvoice);
}

