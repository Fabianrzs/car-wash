import { getTenantPlanStatus } from "@/lib";
import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

export async function getBillingOverviewService(tenantId: string, tenant: {
  plan: unknown;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  trialEndsAt: Date | null;
}) {
  const pendingInvoice = await tenantModuleRepository.findInvoiceFirst({
    where: { tenantId, status: { in: ["PENDING", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
    select: { id: true, dueDate: true },
  });

  const planStatus = getTenantPlanStatus(tenant as never, pendingInvoice);

  const invoices = await tenantModuleRepository.findManyInvoices({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { plan: true },
  });

  const scheduledChange = await tenantModuleRepository.findScheduledPlanChangeFirst({
    where: { tenantId, status: "SCHEDULED" },
    include: { toPlan: true },
  });

  return {
    plan: tenant.plan || null,
    stripeSubscriptionId: tenant.stripeSubscriptionId || null,
    stripeCustomerId: tenant.stripeCustomerId || null,
    trialEndsAt: tenant.trialEndsAt || null,
    planStatus,
    invoices,
    scheduledChange,
  };
}

export async function disconnectTenantPlanService(tenantId: string) {
  await tenantModuleRepository.updateTenant({
    where: { id: tenantId },
    data: { plan: { disconnect: true }, trialEndsAt: null },
  });

  await tenantModuleRepository.updateManyInvoices({
    where: { tenantId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  await tenantModuleRepository.updateManyScheduledPlanChanges({
    where: { tenantId, status: "SCHEDULED" },
    data: { status: "CANCELLED" },
  });
}

export async function assignFreePlanService(tenantId: string, planId: string) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  await tenantModuleRepository.updateTenant({
    where: { id: tenantId },
    data: { plan: { connect: { id: planId } }, trialEndsAt },
  });
}

export async function getPlanByIdService(planId: string) {
  return tenantModuleRepository.findPlanUnique({ where: { id: planId } });
}

export async function createScheduledPlanChangeService(input: {
  tenantId: string;
  fromPlanId?: string | null;
  toPlanId: string;
  invoiceId: string;
  effectiveDate: Date;
}) {
  return tenantModuleRepository.createScheduledPlanChange({
    data: {
      tenant: { connect: { id: input.tenantId } },
      fromPlan: input.fromPlanId ? { connect: { id: input.fromPlanId } } : undefined,
      toPlan: { connect: { id: input.toPlanId } },
      invoice: { connect: { id: input.invoiceId } },
      effectiveDate: input.effectiveDate,
      status: "SCHEDULED",
    },
  });
}

