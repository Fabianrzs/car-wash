import { tenantModuleRepository } from "@/modules/tenant/repositories/tenant.repository";
import { getPSEBanksList, queryTransactionByReference } from "@/lib/payments/payu";

export async function getPaymentByIdService(tenantId: string, paymentId: string) {
  return tenantModuleRepository.findPaymentUnique({
    where: { id: paymentId, tenantId },
  });
}

export async function getInvoiceForPaymentService(tenantId: string, invoiceId: string) {
  return tenantModuleRepository.findInvoiceUnique({
    where: { id: invoiceId, tenantId },
    include: { plan: true, tenant: true },
  });
}

export async function createPaymentForInvoiceService(input: {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: "PSE" | "CREDIT_CARD";
  payuOrderId: string | null;
  payuTransactionId: string | null;
  payuReferenceCode: string;
  payuResponseCode: string;
  pseBank: string | null;
  pseBankUrl: string | null;
  isApproved: boolean;
  metadata: { payerName?: string; payerDocument?: string; payerEmail?: string };
}) {
  return tenantModuleRepository.createPayment({
    data: {
      invoice: { connect: { id: input.invoiceId } },
      tenant: { connect: { id: input.tenantId } },
      amount: input.amount,
      method: input.method,
      status: input.isApproved ? "APPROVED" : "PENDING",
      payuOrderId: input.payuOrderId,
      payuTransactionId: input.payuTransactionId,
      payuReferenceCode: input.payuReferenceCode,
      payuResponseCode: input.payuResponseCode,
      pseBank: input.pseBank,
      pseBankUrl: input.pseBankUrl,
      paidAt: input.isApproved ? new Date() : null,
      metadata: input.metadata,
    },
  });
}

export async function getPaymentDetailByIdService(tenantId: string, paymentId: string) {
  return tenantModuleRepository.findPaymentUnique({
    where: { id: paymentId, tenantId },
    include: {
      invoice: {
        select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
      },
    },
  });
}

export async function updatePaymentStatusService(
  paymentId: string,
  data: {
    status: string;
    payuResponseCode?: string | null;
    paidAt?: Date | null;
  }
) {
  return tenantModuleRepository.updatePayment({
    where: { id: paymentId },
    data: {
      status: data.status as never,
      payuResponseCode: data.payuResponseCode ?? undefined,
      paidAt: data.paidAt ?? undefined,
    },
    include: {
      invoice: {
        select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
      },
    },
  });
}

export async function getBanksListService() {
  return getPSEBanksList();
}

export async function checkPaymentStatusService(payuReferenceCode: string) {
  return queryTransactionByReference(payuReferenceCode);
}

