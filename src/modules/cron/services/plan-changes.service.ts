import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

/**
 * Processes scheduled plan changes that are due.
 * Applies changes with paid invoices, cancels those with overdue/cancelled invoices.
 */
export async function processScheduledPlanChangesService(): Promise<{
  applied: number;
  blocked: number;
  totalChecked: number;
}> {
  const now = new Date();

  const dueChanges = await tenantModuleRepository.findManyScheduledPlanChanges({
    where: { status: "SCHEDULED", effectiveDate: { lte: now } },
    include: {
      toPlan: true,
      invoice: { select: { id: true, status: true, periodEnd: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
    take: 50,
  });

  const toCancelIds: string[] = [];
  const toApply: typeof dueChanges = [];

  for (const change of dueChanges) {
    if (change.invoice && change.invoice.status !== "PAID") {
      if (["OVERDUE", "CANCELLED"].includes(change.invoice.status)) {
        toCancelIds.push(change.id);
      }
      continue;
    }
    toApply.push(change);
  }

  if (toCancelIds.length > 0) {
    await tenantModuleRepository.updateManyScheduledPlanChanges({
      where: { id: { in: toCancelIds } },
      data: { status: "CANCELLED" },
    });
  }

  let applied = 0;
  if (toApply.length > 0) {
    await tenantModuleRepository.transaction(async (tx) => {
      for (const change of toApply) {
        await tenantModuleRepository.updateTenant({
          where: { id: change.tenantId },
          data: {
            plan: { connect: { id: change.toPlanId } },
            trialEndsAt: change.invoice?.periodEnd ?? null,
          },
        }, tx);

        await tenantModuleRepository.updateScheduledPlanChange({
          where: { id: change.id },
          data: { status: "APPLIED" },
        }, tx);
      }
    });
    applied = toApply.length;
  }

  // Check expired plans without renewal
  const expiredTenants = await tenantModuleRepository.findManyTenants({
    where: { isActive: true, planId: { not: null }, trialEndsAt: { lt: now }, stripeSubscriptionId: null },
    select: { id: true },
  });

  let blocked = 0;
  if (expiredTenants.length > 0) {
    const expiredIds = expiredTenants.map((t) => t.id);
    const renewed = await tenantModuleRepository.findManyInvoices({
      where: { tenantId: { in: expiredIds }, status: "PAID", periodEnd: { gt: now } },
      select: { tenantId: true },
      distinct: ["tenantId"],
    });
    const renewedSet = new Set(renewed.map((i) => i.tenantId));
    blocked = expiredIds.length - renewedSet.size;
  }

  return { applied, blocked, totalChecked: dueChanges.length };
}

