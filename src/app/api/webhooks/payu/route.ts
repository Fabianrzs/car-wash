import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePayUConfirmation, verifyPayUSignature, getPayUStateLabel } from "@/lib/payu";
import { markInvoicePaid } from "@/lib/invoice";

export async function POST(request: Request) {
  try {
    // PayU sends confirmation as form-urlencoded
    const contentType = request.headers.get("content-type") || "";
    let data: Record<string, string>;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      data = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
    } else {
      // Also handle JSON format
      const body = await request.json();
      data = body;
    }

    const confirmation = parsePayUConfirmation(data);
    console.log(`PayU confirmation received: ref=${confirmation.referenceCode} state=${confirmation.state}`);

    // Verify signature
    const isValid = verifyPayUSignature(
      confirmation.referenceCode,
      confirmation.amount,
      confirmation.currency,
      confirmation.sign
    );

    if (!isValid) {
      console.error("PayU signature verification failed", { referenceCode: confirmation.referenceCode });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Find the payment by reference code
    const payment = await prisma.payment.findUnique({
      where: { payuReferenceCode: confirmation.referenceCode },
      include: { invoice: true },
    });

    if (!payment) {
      console.warn(`PayU confirmation for unknown reference: ${confirmation.referenceCode}`);
      return NextResponse.json({ received: true });
    }

    const stateLabel = getPayUStateLabel(confirmation.state);
    let newStatus: "APPROVED" | "DECLINED" | "EXPIRED" | "ERROR" | "PENDING" = "PENDING";

    switch (stateLabel) {
      case "APPROVED":
        newStatus = "APPROVED";
        break;
      case "DECLINED":
        newStatus = "DECLINED";
        break;
      case "EXPIRED":
        newStatus = "EXPIRED";
        break;
      case "ERROR":
        newStatus = "ERROR";
        break;
      default:
        newStatus = "PENDING";
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        payuOrderId: confirmation.merchantId || payment.payuOrderId,
        payuTransactionId: confirmation.transactionId || payment.payuTransactionId,
        payuResponseCode: confirmation.responseCode,
        paidAt: newStatus === "APPROVED" ? new Date() : null,
      },
    });

    // If approved, mark invoice as paid and activate plan
    if (newStatus === "APPROVED") {
      await markInvoicePaid(payment.invoiceId);
      console.log(`Payment approved for invoice ${payment.invoice.invoiceNumber}`);
    }

    // If declined/expired/error, check if there are no more pending payments
    if (["DECLINED", "EXPIRED", "ERROR"].includes(newStatus)) {
      const otherPending = await prisma.payment.count({
        where: {
          invoiceId: payment.invoiceId,
          id: { not: payment.id },
          status: "PENDING",
        },
      });

      if (otherPending === 0 && payment.invoice.status !== "PAID") {
        // Check if invoice is past due
        if (new Date() > payment.invoice.dueDate) {
          await prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: "OVERDUE" },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing PayU webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// PayU also does GET for confirmation page redirect
export async function GET(request: Request) {
  return NextResponse.json({ status: "ok" });
}
