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

    let applied = 0;

    for (const change of dueChanges) {
      // Only apply if the invoice is paid
      if (change.invoice && change.invoice.status !== "PAID") {
        // If overdue or cancelled, cancel the plan change
        if (["OVERDUE", "CANCELLED"].includes(change.invoice.status)) {
          await prisma.scheduledPlanChange.update({
            where: { id: change.id },
            data: { status: "CANCELLED" },
          });
        }
        continue;
      }

      // Apply the plan change
      await prisma.tenant.update({
        where: { id: change.tenantId },
        data: {
          plan: { connect: { id: change.toPlanId } },
          trialEndsAt: change.invoice?.periodEnd || null,
        },
      });

      await prisma.scheduledPlanChange.update({
        where: { id: change.id },
        data: { status: "APPLIED" },
      });

      console.log(
        `Plan change applied for tenant ${change.tenant.name}: ` +
          `→ ${change.toPlan.name}`
      );

      applied++;
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

    let blocked = 0;
    for (const tenant of expiredTenants) {
      // Check if there's a paid invoice extending the period
      const renewalInvoice = await prisma.invoice.findFirst({
        where: {
          tenantId: tenant.id,
          status: "PAID",
          periodEnd: { gt: now },
        },
      });

      if (!renewalInvoice) {
        // Plan expired, no renewal → will be blocked by getTenantPlanStatus
        blocked++;
      }
    }

    return NextResponse.json({ applied, blocked, totalChecked: dueChanges.length });
  } catch (error) {
    console.error("Error processing plan changes:", error);
    return NextResponse.json({ error: "Error processing plan changes" }, { status: 500 });
  }
}
