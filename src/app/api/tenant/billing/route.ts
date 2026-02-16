import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, getTenantPlanStatus } from "@/lib/tenant";
import { createPlanInvoice, calculateNextPeriod, getCurrentPeriodEnd, hasPendingInvoice, createInvoiceReminders } from "@/lib/invoice";
import { createBillingPortalSession } from "@/lib/stripe";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    // Get pending/overdue invoices
    const pendingInvoice = await prisma.invoice.findFirst({
      where: { tenantId, status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      select: { id: true, dueDate: true },
    });

    const planStatus = tenant ? getTenantPlanStatus(tenant, pendingInvoice) : null;

    // Get recent invoices
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { plan: true },
    });

    // Get scheduled plan change
    const scheduledChange = await prisma.scheduledPlanChange.findFirst({
      where: { tenantId, status: "SCHEDULED" },
      include: { toPlan: true },
    });

    return NextResponse.json({
      plan: tenant?.plan || null,
      stripeSubscriptionId: tenant?.stripeSubscriptionId || null,
      stripeCustomerId: tenant?.stripeCustomerId || null,
      trialEndsAt: tenant?.trialEndsAt || null,
      planStatus,
      invoices,
      scheduledChange,
    });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener facturacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role === "EMPLOYEE") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { action, planId } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
    const protocol = appDomain.includes("localhost") ? "http" : "https";

    // Legacy Stripe portal action
    if (action === "portal" && tenant.stripeCustomerId) {
      const portalSession = await createBillingPortalSession({
        stripeCustomerId: tenant.stripeCustomerId,
        returnUrl: `${protocol}://${tenant.slug}.${appDomain}/billing`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // ========================================
    // Change Plan → Generate Invoice (PayU flow)
    // ========================================
    if (action === "change-plan") {
      if (planId === null) {
        // Disconnect plan
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: { disconnect: true }, trialEndsAt: null },
        });
        // Cancel pending invoices
        await prisma.invoice.updateMany({
          where: { tenantId, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        // Cancel scheduled changes
        await prisma.scheduledPlanChange.updateMany({
          where: { tenantId, status: "SCHEDULED" },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json({ success: true, message: "Plan desvinculado" });
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
      }

      // Free plan → assign directly with 30-day trial
      if (Number(plan.price) === 0) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: { connect: { id: plan.id } }, trialEndsAt },
        });
        return NextResponse.json({ success: true, message: "Plan gratuito activado" });
      }

      // Check if already has pending invoice for this plan
      const alreadyPending = await hasPendingInvoice(tenantId, plan.id);
      if (alreadyPending) {
        return NextResponse.json({ error: "Ya tienes una factura pendiente para este plan" }, { status: 400 });
      }

      // Paid plan → Generate invoice
      const currentPeriodEnd = await getCurrentPeriodEnd(tenantId);
      const isCurrentPlanActive = tenant.planId && tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date();

      let periodStart: Date;
      let periodEnd: Date;

      if (isCurrentPlanActive && currentPeriodEnd && currentPeriodEnd > new Date()) {
        // Has active plan → schedule change at end of current period
        const next = calculateNextPeriod(currentPeriodEnd, plan.interval);
        periodStart = next.start;
        periodEnd = next.end;
      } else {
        // No active plan or expired → starts now
        const next = calculateNextPeriod(null, plan.interval);
        periodStart = next.start;
        periodEnd = next.end;
      }

      const invoice = await createPlanInvoice({
        tenantId,
        planId: plan.id,
        periodStart,
        periodEnd,
      });

      // Create reminders
      await createInvoiceReminders(tenantId, invoice.id, invoice.dueDate);

      // If changing from an active plan, schedule the change
      if (isCurrentPlanActive && tenant.planId !== plan.id) {
        await prisma.scheduledPlanChange.create({
          data: {
            tenant: { connect: { id: tenantId } },
            fromPlan: tenant.planId ? { connect: { id: tenant.planId } } : undefined,
            toPlan: { connect: { id: plan.id } },
            invoice: { connect: { id: invoice.id } },
            effectiveDate: periodStart,
            status: "SCHEDULED",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Factura generada",
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error en facturacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
