import { prisma } from "@/database/prisma";

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

  const dueChanges = await prisma.scheduledPlanChange.findMany({
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
    await prisma.scheduledPlanChange.updateMany({
      where: { id: { in: toCancelIds } },
      data: { status: "CANCELLED" },
    });
  }

  let applied = 0;
  if (toApply.length > 0) {
    await prisma.$transaction(
      toApply.flatMap((change) => [
        prisma.tenant.update({
          where: { id: change.tenantId },
          data: {
            plan: { connect: { id: change.toPlanId } },
            trialEndsAt: change.invoice?.periodEnd ?? null,
          },
        }),
        prisma.scheduledPlanChange.update({
          where: { id: change.id },
          data: { status: "APPLIED" },
        }),
      ])
    );
    applied = toApply.length;
  }

  // Check expired plans without renewal
  const expiredTenants = await prisma.tenant.findMany({
    where: { isActive: true, planId: { not: null }, trialEndsAt: { lt: now }, stripeSubscriptionId: null },
    select: { id: true },
  });

  let blocked = 0;
  if (expiredTenants.length > 0) {
    const expiredIds = expiredTenants.map((t) => t.id);
    const renewed = await prisma.invoice.findMany({
      where: { tenantId: { in: expiredIds }, status: "PAID", periodEnd: { gt: now } },
      select: { tenantId: true },
      distinct: ["tenantId"],
    });
    const renewedSet = new Set(renewed.map((i) => i.tenantId));
    blocked = expiredIds.length - renewedSet.size;
  }

  return { applied, blocked, totalChecked: dueChanges.length };
}

