import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReminderEmail } from "@/lib/email";

// Called by cron job to process pending reminders
// Should be protected by a secret in production
export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find reminders that are due and haven't been sent
    const dueReminders = await prisma.paymentReminder.findMany({
      where: {
        sentAt: null,
        scheduledFor: { lte: now },
      },
      include: {
        tenant: { select: { id: true, name: true, email: true, slug: true } },
        invoice: {
          select: { id: true, invoiceNumber: true, totalAmount: true, dueDate: true, status: true },
        },
      },
      take: 100,
    });

    // Categorize reminders in memory
    const skipIds: string[] = [];
    const overdueInvoiceIds: string[] = [];
    let processed = 0;

    for (const reminder of dueReminders) {
      if (reminder.invoice && ["PAID", "CANCELLED"].includes(reminder.invoice.status)) {
        skipIds.push(reminder.id);
        continue;
      }

      if (reminder.type === "EXPIRED" && reminder.invoice && reminder.invoice.status === "PENDING") {
        overdueInvoiceIds.push(reminder.invoice.id);
      }

      if (reminder.tenant.email && reminder.invoice) {
        sendPaymentReminderEmail(
          reminder.tenant.email,
          reminder.tenant.name,
          reminder.invoice.invoiceNumber,
          Number(reminder.invoice.totalAmount),
          reminder.invoice.dueDate,
          reminder.type
        ).catch((err) =>
          console.error(`Error sending reminder email for tenant ${reminder.tenant.name}:`, err)
        );
      }

      processed++;
    }

    // Batch updates
    const allReminderIds = dueReminders.map((r) => r.id);

    await Promise.all([
      // Mark all reminders as sent in one query
      allReminderIds.length > 0
        ? prisma.paymentReminder.updateMany({
            where: { id: { in: allReminderIds } },
            data: { sentAt: now },
          })
        : Promise.resolve(),
      // Mark overdue invoices in one query
      overdueInvoiceIds.length > 0
        ? prisma.invoice.updateMany({
            where: { id: { in: overdueInvoiceIds } },
            data: { status: "OVERDUE" },
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ processed, total: dueReminders.length });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return NextResponse.json({ error: "Error processing reminders" }, { status: 500 });
  }
}
