import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    let processed = 0;

    for (const reminder of dueReminders) {
      // Skip if invoice is already paid or cancelled
      if (reminder.invoice && ["PAID", "CANCELLED"].includes(reminder.invoice.status)) {
        await prisma.paymentReminder.update({
          where: { id: reminder.id },
          data: { sentAt: now },
        });
        continue;
      }

      // Mark overdue invoices
      if (reminder.type === "EXPIRED" && reminder.invoice && reminder.invoice.status === "PENDING") {
        await prisma.invoice.update({
          where: { id: reminder.invoice.id },
          data: { status: "OVERDUE" },
        });
      }

      // In production, you would send an email/notification here
      // For now, we just log and mark as sent
      console.log(
        `Reminder [${reminder.type}] for tenant ${reminder.tenant.name}: ` +
          `Invoice ${reminder.invoice?.invoiceNumber || "N/A"} - ` +
          `$${reminder.invoice?.totalAmount || 0} due ${reminder.invoice?.dueDate?.toISOString() || "N/A"}`
      );

      await prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });

      processed++;
    }

    return NextResponse.json({ processed, total: dueReminders.length });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return NextResponse.json({ error: "Error processing reminders" }, { status: 500 });
  }
}
