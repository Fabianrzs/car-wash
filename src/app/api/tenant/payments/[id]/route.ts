import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError } from "@/lib/tenant";
import { queryTransactionByReference } from "@/lib/payu";
import { markInvoicePaid } from "@/lib/invoice";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id, tenantId },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
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
          const updated = await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: newStatus as any,
              payuResponseCode: payuStatus.responseCode || payment.payuResponseCode,
              paidAt: newStatus === "APPROVED" ? new Date() : null,
            },
            include: {
              invoice: {
                select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
              },
            },
          });

          // If approved, mark invoice as paid and activate plan
          if (newStatus === "APPROVED") {
            await markInvoicePaid(payment.invoiceId);
          }

          return NextResponse.json(updated);
        }
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener pago:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
