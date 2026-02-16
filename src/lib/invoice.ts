import { prisma } from "@/lib/prisma";

// =============================================
// Invoice Number Generation
// =============================================

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `FAC-${year}${month}`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let seq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0", 10);
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(5, "0")}`;
}

// =============================================
// PayU Reference Code Generation
// =============================================

export function generatePayUReferenceCode(invoiceId: string): string {
  const timestamp = Date.now().toString(36);
  return `CW-${invoiceId.slice(-8)}-${timestamp}`;
}

// =============================================
// Create Invoice for Plan Subscription
// =============================================

export interface CreateInvoiceParams {
  tenantId: string;
  planId: string;
  periodStart: Date;
  periodEnd: Date;
}

const IVA_RATE = 0.19; // Colombia IVA 19%

export async function createPlanInvoice(params: CreateInvoiceParams) {
  const plan = await prisma.plan.findUnique({
    where: { id: params.planId },
  });

  if (!plan) throw new Error("Plan no encontrado");

  const baseAmount = Number(plan.price);
  const tax = Math.round(baseAmount * IVA_RATE);
  const totalAmount = baseAmount + tax;

  const invoiceNumber = await generateInvoiceNumber(params.tenantId);

  // Due date: 5 days before period start (must pay before using)
  const dueDate = new Date(params.periodStart);
  dueDate.setDate(dueDate.getDate() - 5);
  // If dueDate is in the past, set to 3 days from now
  if (dueDate < new Date()) {
    dueDate.setTime(Date.now() + 3 * 24 * 60 * 60 * 1000);
  }

  const intervalLabel = plan.interval === "MONTHLY" ? "Mensual" : "Anual";
  const startStr = params.periodStart.toLocaleDateString("es-CO");
  const endStr = params.periodEnd.toLocaleDateString("es-CO");

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      tenant: { connect: { id: params.tenantId } },
      plan: { connect: { id: params.planId } },
      amount: baseAmount,
      tax,
      totalAmount,
      status: "PENDING",
      description: `Suscripcion Plan ${plan.name} (${intervalLabel}) - Periodo: ${startStr} al ${endStr}`,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      dueDate,
      items: {
        create: [
          {
            description: `Plan ${plan.name} - ${intervalLabel}`,
            quantity: 1,
            unitPrice: baseAmount,
            subtotal: baseAmount,
          },
          {
            description: `IVA (19%)`,
            quantity: 1,
            unitPrice: tax,
            subtotal: tax,
          },
        ],
      },
    },
    include: { items: true, plan: true },
  });

  return invoice;
}

// =============================================
// Calculate Next Billing Period
// =============================================

export function calculateNextPeriod(
  currentPeriodEnd: Date | null,
  interval: "MONTHLY" | "YEARLY"
): { start: Date; end: Date } {
  const start = currentPeriodEnd ? new Date(currentPeriodEnd) : new Date();

  // If current period hasn't ended, start from end of current period
  if (currentPeriodEnd && currentPeriodEnd > new Date()) {
    start.setTime(currentPeriodEnd.getTime());
  } else {
    start.setTime(Date.now());
  }

  const end = new Date(start);
  if (interval === "MONTHLY") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }

  return { start, end };
}

// =============================================
// Create Reminders for an Invoice
// =============================================

export async function createInvoiceReminders(
  tenantId: string,
  invoiceId: string,
  dueDate: Date
) {
  const reminders = [
    { type: "EXPIRING_7_DAYS" as const, daysBefore: 7 },
    { type: "EXPIRING_3_DAYS" as const, daysBefore: 3 },
    { type: "EXPIRING_1_DAY" as const, daysBefore: 1 },
    { type: "EXPIRED" as const, daysBefore: 0 },
  ];

  const data = reminders
    .map(({ type, daysBefore }) => {
      const scheduledFor = new Date(dueDate);
      scheduledFor.setDate(scheduledFor.getDate() - daysBefore);
      // Don't create reminders in the past (except EXPIRED)
      if (scheduledFor < new Date() && type !== "EXPIRED") return null;
      return {
        tenantId,
        invoiceId,
        type,
        scheduledFor,
      };
    })
    .filter(Boolean) as {
    tenantId: string;
    invoiceId: string;
    type: "EXPIRING_7_DAYS" | "EXPIRING_3_DAYS" | "EXPIRING_1_DAY" | "EXPIRED";
    scheduledFor: Date;
  }[];

  if (data.length > 0) {
    await prisma.paymentReminder.createMany({ data });
  }
}

// =============================================
// Mark Invoice as Paid and Activate Plan
// =============================================

export async function markInvoicePaid(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { plan: true },
  });

  if (!invoice) throw new Error("Factura no encontrada");
  if (invoice.status === "PAID") return invoice;

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
    include: { plan: true },
  });

  // Activate the plan for the tenant
  if (invoice.planId) {
    await prisma.tenant.update({
      where: { id: invoice.tenantId },
      data: {
        plan: { connect: { id: invoice.planId } },
        isActive: true,
        // Set period end as trialEndsAt so the system knows when access expires
        trialEndsAt: invoice.periodEnd,
      },
    });

    // Apply any scheduled plan changes linked to this invoice
    await prisma.scheduledPlanChange.updateMany({
      where: { invoiceId: invoice.id, status: "SCHEDULED" },
      data: { status: "APPLIED" },
    });
  }

  return updated;
}

// =============================================
// Get current billing period for a tenant
// =============================================

export async function getCurrentPeriodEnd(tenantId: string): Promise<Date | null> {
  // Check the latest paid invoice
  const lastPaidInvoice = await prisma.invoice.findFirst({
    where: { tenantId, status: "PAID" },
    orderBy: { periodEnd: "desc" },
    select: { periodEnd: true },
  });

  return lastPaidInvoice?.periodEnd ?? null;
}

// =============================================
// Check for pending invoices
// =============================================

export async function hasPendingInvoice(tenantId: string, planId: string): Promise<boolean> {
  const pending = await prisma.invoice.findFirst({
    where: {
      tenantId,
      planId,
      status: { in: ["PENDING"] },
    },
  });
  return !!pending;
}
