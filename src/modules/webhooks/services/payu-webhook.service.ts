import {
  getPayUStateLabel,
  markInvoicePaid,
  parsePayUConfirmation,
  verifyPayUSignature,
} from "@/lib/payments";
import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";

/**
 * Process a PayU payment confirmation webhook.
 */
export async function processPayUConfirmationService(
  data: Record<string, string>
): Promise<void> {
  const confirmation = parsePayUConfirmation(data);

  const isValid = verifyPayUSignature(
    confirmation.referenceCode,
    confirmation.amount,
    confirmation.currency,
    confirmation.sign
  );
  if (!isValid) throw new Error("Firma PayU inválida");

  const payment = await tenantModuleRepository.findPaymentUnique({
    where: { payuReferenceCode: confirmation.referenceCode },
    include: { invoice: true },
  });
  if (!payment) return; // silently ignore unknown references

  const stateLabel = getPayUStateLabel(confirmation.state);
  const statusMap: Record<string, "APPROVED" | "DECLINED" | "EXPIRED" | "ERROR" | "PENDING"> = {
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    EXPIRED: "EXPIRED",
    ERROR: "ERROR",
  };
  const newStatus = statusMap[stateLabel] ?? "PENDING";

  await tenantModuleRepository.updatePayment({
    where: { id: payment.id },
    data: {
      status: newStatus,
      payuOrderId: confirmation.merchantId ?? payment.payuOrderId,
      payuTransactionId: confirmation.transactionId ?? payment.payuTransactionId,
      payuResponseCode: confirmation.responseCode,
      paidAt: newStatus === "APPROVED" ? new Date() : null,
    },
  });

  if (newStatus === "APPROVED") {
    await markInvoicePaid(payment.invoiceId);
  }

  if (["DECLINED", "EXPIRED", "ERROR"].includes(newStatus)) {
    const otherPending = await tenantModuleRepository.countPayments({
      where: { invoiceId: payment.invoiceId, id: { not: payment.id }, status: "PENDING" },
    });
    if (otherPending === 0 && payment.invoice.status !== "PAID") {
      if (new Date() > payment.invoice.dueDate) {
        await tenantModuleRepository.updateInvoice({ where: { id: payment.invoiceId }, data: { status: "OVERDUE" } });
      }
    }
  }
}

