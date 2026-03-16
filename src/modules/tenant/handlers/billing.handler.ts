import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { buildTenantUrl } from "@/lib/utils/domain";
import {
    calculateNextPeriod,
    createBillingPortalSession,
    createInvoiceReminders, createPlanInvoice,
    getCurrentPeriodEnd,
    hasPendingInvoice
} from "@/lib/payments";
import {
  assignFreePlanService,
  createScheduledPlanChangeService,
  disconnectTenantPlanService,
  getBillingOverviewService,
  getPlanByIdService,
} from "@/modules/tenant/services/billing.service";


export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const overview = await getBillingOverviewService(tenantId, tenant);
    return ApiResponse.ok(overview);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener facturacion:");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const body = await request.json();
    const { action, planId } = body;

    // Legacy Stripe portal action
    if (action === "portal" && tenant.stripeCustomerId) {
      const portalSession = await createBillingPortalSession({
        stripeCustomerId: tenant.stripeCustomerId,
        returnUrl: buildTenantUrl(tenant.slug, "/billing"),
      });
      return ApiResponse.ok({ url: portalSession.url });
    }

    // ========================================
    // Change Plan → Generate Invoice (PayU flow)
    // ========================================
    if (action === "change-plan") {
      if (planId === null) {
        await disconnectTenantPlanService(tenantId);
        return ApiResponse.ok({ success: true, message: "Plan desvinculado" });
      }

      const plan = await getPlanByIdService(planId);
      if (!plan) {
        return ApiResponse.notFound("Plan no encontrado");
      }

      // Free plan → assign directly with 30-day trial
      if (Number(plan.price) === 0) {
        await assignFreePlanService(tenantId, plan.id);
        return ApiResponse.ok({ success: true, message: "Plan gratuito activado" });
      }

      // Check if already has pending invoice for this plan
      const alreadyPending = await hasPendingInvoice(tenantId, plan.id);
      if (alreadyPending) {
        return ApiResponse.badRequest("Ya tienes una factura pendiente para este plan");
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
        await createScheduledPlanChangeService({
          tenantId,
          fromPlanId: tenant.planId,
          toPlanId: plan.id,
          invoiceId: invoice.id,
          effectiveDate: periodStart,
        });
      }

      return ApiResponse.ok({
        success: true,
        message: "Factura generada",
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
      });
    }

    return ApiResponse.badRequest("Accion no valida");
  } catch (error) {
    return handleTenantHttpError(error, "Error en facturacion:");
  }
}
