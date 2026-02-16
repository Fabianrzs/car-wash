import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError } from "@/lib/tenant";
import { generatePayUReferenceCode } from "@/lib/invoice";
import { createPSEPayment, createCreditCardPayment } from "@/lib/payu";
import { markInvoicePaid } from "@/lib/invoice";

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
    const { invoiceId, method, payerInfo } = body;

    // Validate invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, tenantId },
      include: { plan: true, tenant: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Esta factura ya fue pagada" }, { status: 400 });
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "Esta factura fue cancelada" }, { status: 400 });
    }

    const referenceCode = generatePayUReferenceCode(invoiceId);
    const amount = Number(invoice.totalAmount);
    const tax = Number(invoice.tax);
    const taxReturnBase = Number(invoice.amount);

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
    const protocol = appDomain.includes("localhost") ? "http" : "https";
    const responseUrl = `${protocol}://${invoice.tenant.slug}.${appDomain}/billing/invoices/${invoiceId}?payment=complete`;

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
      return NextResponse.json({ error: "Metodo de pago no soportado" }, { status: 400 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoice: { connect: { id: invoiceId } },
        tenant: { connect: { id: tenantId } },
        amount,
        method: method as "PSE" | "CREDIT_CARD",
        status: paymentResult.state === "APPROVED" ? "APPROVED" : "PENDING",
        payuOrderId: paymentResult.orderId,
        payuTransactionId: paymentResult.transactionId,
        payuReferenceCode: referenceCode,
        payuResponseCode: paymentResult.responseCode,
        pseBank: method === "PSE" ? body.payerInfo.pseBank : null,
        pseBankUrl: method === "PSE" ? paymentResult.bankUrl : null,
        paidAt: paymentResult.state === "APPROVED" ? new Date() : null,
        metadata: {
          payerName: payerInfo.fullName,
          payerDocument: payerInfo.document,
          payerEmail: payerInfo.email,
        },
      },
    });

    // If immediately approved (credit card), mark invoice as paid
    if (paymentResult.state === "APPROVED") {
      await markInvoicePaid(invoiceId);
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      bankUrl: paymentResult.bankUrl || null,
      responseCode: paymentResult.responseCode,
    }, { status: 201 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al crear pago:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
