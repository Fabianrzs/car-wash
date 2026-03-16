import { prisma } from "@/database/prisma";
import { getPSEBanksList } from "@/lib/payu";
import { queryTransactionByReference } from "@/lib/payu";

export async function getPaymentByIdService(tenantId: string, paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId, tenantId },
  });
}

export async function getBanksListService() {
  return getPSEBanksList();
}

export async function checkPaymentStatusService(payuReferenceCode: string) {
  return queryTransactionByReference(payuReferenceCode);
}

