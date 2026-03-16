import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { queryTransactionByReference } from "@/lib/payments/payu";
import { markInvoicePaid } from "@/lib/payments/invoice";
import {
  getPaymentDetailByIdService,
  updatePaymentStatusService,
} from "@/modules/tenant/services/payments.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const { id } = await params;

    const payment = await getPaymentDetailByIdService(tenantId, id);

    if (!payment) {
      return ApiResponse.notFound("Pago no encontrado");
    }

    // If pending, check with PayU for real-time status
    if (payment.status === "PENDING" && payment.payuReferenceCode) {
      const payuStatus = await queryTransactionByReference(payment.payuReferenceCode);

      if (payuStatus) {
        let newStatus: string = payment.status;
        if (payuStatus.transactionState === "APPROVED" || payuStatus.status === "CAPTURED") {
          newStatus = "APPROVED";
        } else if (payuStatus.transactionState === "DECLINED") {
          newStatus = "DECLINED";
        } else if (payuStatus.transactionState === "EXPIRED") {
          newStatus = "EXPIRED";
        } else if (payuStatus.transactionState === "ERROR") {
          newStatus = "ERROR";
        }

        if (newStatus !== payment.status) {
          const updated = await updatePaymentStatusService(payment.id, {
            status: newStatus,
            payuResponseCode: payuStatus.responseCode || payment.payuResponseCode,
            paidAt: newStatus === "APPROVED" ? new Date() : null,
          });

          // If approved, mark invoice as paid and activate plan
          if (newStatus === "APPROVED") {
            await markInvoicePaid(payment.invoiceId);
          }

          return ApiResponse.ok(updated);
        }
      }
    }

    return ApiResponse.ok(payment);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener pago:");
  }
}
