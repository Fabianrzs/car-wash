import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by cron job to apply scheduled plan changes
export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find scheduled plan changes that are due and have a paid invoice
    const dueChanges = await prisma.scheduledPlanChange.findMany({
      where: {
        status: "SCHEDULED",
        effectiveDate: { lte: now },
      },
      include: {
        toPlan: true,
        invoice: { select: { id: true, status: true, periodEnd: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
      take: 50,
    });

    // Categorize changes in memory
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

    // Batch cancel in one query
    if (toCancelIds.length > 0) {
      await prisma.scheduledPlanChange.updateMany({
        where: { id: { in: toCancelIds } },
        data: { status: "CANCELLED" },
      });
    }

    // Apply changes in a single transaction
    let applied = 0;
    if (toApply.length > 0) {
      await prisma.$transaction(
        toApply.flatMap((change) => [
          prisma.tenant.update({
            where: { id: change.tenantId },
            data: {
              plan: { connect: { id: change.toPlanId } },
              trialEndsAt: change.invoice?.periodEnd || null,
            },
          }),
          prisma.scheduledPlanChange.update({
            where: { id: change.id },
            data: { status: "APPLIED" },
          }),
        ])
      );

      for (const change of toApply) {
        console.log(
          `Plan change applied for tenant ${change.tenant.name}: ` +
            `→ ${change.toPlan.name}`
        );
      }
      applied = toApply.length;
    }

    // Also check for expired plans (trialEndsAt passed, no renewal invoice)
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        planId: { not: null },
        trialEndsAt: { lt: now },
        stripeSubscriptionId: null,
      },
      select: { id: true, slug: true },
    });

    // Batch check for renewal invoices instead of N+1
    const expiredTenantIds = expiredTenants.map((t) => t.id);
    let blocked = 0;

    if (expiredTenantIds.length > 0) {
      const tenantsWithRenewal = await prisma.invoice.findMany({
        where: {
          tenantId: { in: expiredTenantIds },
          status: "PAID",
          periodEnd: { gt: now },
        },
        select: { tenantId: true },
        distinct: ["tenantId"],
      });

      const renewedTenantIds = new Set(tenantsWithRenewal.map((i) => i.tenantId));
      blocked = expiredTenantIds.length - renewedTenantIds.size;
    }

    return NextResponse.json({ applied, blocked, totalChecked: dueChanges.length });
  } catch (error) {
    console.error("Error processing plan changes:", error);
    return NextResponse.json({ error: "Error processing plan changes" }, { status: 500 });
  }
}
