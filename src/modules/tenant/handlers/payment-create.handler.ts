import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { generatePayUReferenceCode, markInvoicePaid } from "@/lib/payments/invoice";
import { createPSEPayment, createCreditCardPayment } from "@/lib/payments/payu";
import { buildTenantUrl } from "@/lib/utils/domain";
import {
  createPaymentForInvoiceService,
  getInvoiceForPaymentService,
} from "@/modules/tenant/services/payments.service";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const body = await request.json();
    const { invoiceId, method, payerInfo } = body;

    // Validate invoice exists and belongs to tenant
    const invoice = await getInvoiceForPaymentService(tenantId, invoiceId);

    if (!invoice) {
      return ApiResponse.notFound("Factura no encontrada");
    }

    if (invoice.status === "PAID") {
      return ApiResponse.badRequest("Esta factura ya fue pagada");
    }

    if (invoice.status === "CANCELLED") {
      return ApiResponse.badRequest("Esta factura fue cancelada");
    }

    const referenceCode = generatePayUReferenceCode(invoiceId);
    const amount = Number(invoice.totalAmount);
    const tax = Number(invoice.tax);
    const taxReturnBase = Number(invoice.amount);

    const responseUrl = buildTenantUrl(invoice.tenant.slug, `/billing/invoices/${invoiceId}?payment=complete`);

    // Get IP and user agent from request
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Mozilla/5.0";
    const cookie = `cw_${tenantId}_${Date.now()}`;

    let paymentResult: {
      transactionId: string | null;
      orderId: string | null;
      state: string;
      responseCode: string;
      bankUrl?: string | null;
      pendingReason?: string | null;
    };

    if (method === "PSE") {
      paymentResult = await createPSEPayment({
        referenceCode,
        description: invoice.description || `Factura ${invoice.invoiceNumber}`,
        amount,
        tax,
        taxReturnBase,
        buyerEmail: payerInfo.email || invoice.tenant.email || session.user.email || "",
        buyerFullName: payerInfo.fullName,
        buyerDocument: payerInfo.document,
        buyerDocumentType: payerInfo.documentType || "CC",
        buyerPhone: payerInfo.phone || invoice.tenant.phone || "",
        pseBank: payerInfo.pseBank,
        personType: payerInfo.personType || "N",
        responseUrl,
        ipAddress,
        userAgent,
        cookie,
      });
    } else if (method === "CREDIT_CARD") {
      paymentResult = await createCreditCardPayment({
        referenceCode,
        description: invoice.description || `Factura ${invoice.invoiceNumber}`,
        amount,
        tax,
        taxReturnBase,
        buyerEmail: payerInfo.email || invoice.tenant.email || session.user.email || "",
        buyerFullName: payerInfo.fullName,
        buyerDocument: payerInfo.document,
        buyerDocumentType: payerInfo.documentType || "CC",
        buyerPhone: payerInfo.phone || invoice.tenant.phone || "",
        cardNumber: payerInfo.cardNumber,
        cardExpiration: payerInfo.cardExpiration,
        cardSecurityCode: payerInfo.cardSecurityCode,
        cardHolderName: payerInfo.cardHolderName || payerInfo.fullName,
        installments: payerInfo.installments || 1,
        paymentMethod: payerInfo.cardBrand || "VISA",
        ipAddress,
        userAgent,
        cookie,
      });
    } else {
      return ApiResponse.badRequest("Metodo de pago no soportado");
    }

    // Create payment record
    const payment = await createPaymentForInvoiceService({
      tenantId,
      invoiceId,
      amount,
      method: method as "PSE" | "CREDIT_CARD",
      payuOrderId: paymentResult.orderId,
      payuTransactionId: paymentResult.transactionId,
      payuReferenceCode: referenceCode,
      payuResponseCode: paymentResult.responseCode,
      pseBank: method === "PSE" ? body.payerInfo.pseBank : null,
      pseBankUrl: method === "PSE" ? paymentResult.bankUrl ?? null : null,
      isApproved: paymentResult.state === "APPROVED",
      metadata: {
        payerName: payerInfo.fullName,
        payerDocument: payerInfo.document,
        payerEmail: payerInfo.email,
      },
    });

    // If immediately approved (credit card), mark invoice as paid
    if (paymentResult.state === "APPROVED") {
      await markInvoicePaid(invoiceId);
    }

    return ApiResponse.created({
      paymentId: payment.id,
      status: payment.status,
      bankUrl: paymentResult.bankUrl || null,
      responseCode: paymentResult.responseCode,
    });
  } catch (error) {
    return handleTenantHttpError(error, "Error al crear pago:");
  }
}
