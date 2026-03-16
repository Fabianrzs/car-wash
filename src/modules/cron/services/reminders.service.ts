import { prisma } from "@/database/prisma";
import { sendPaymentReminderEmail } from "@/lib/email";

/**
 * Processes due payment reminders and sends email notifications.
 */
export async function processPaymentRemindersService(): Promise<{
  processed: number;
  failed: number;
}> {
  const now = new Date();

  const dueReminders = await prisma.paymentReminder.findMany({
    where: { sentAt: null, scheduledFor: { lte: now } },
    include: {
      tenant: { select: { id: true, name: true, email: true, slug: true } },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          dueDate: true,
          status: true,
        },
      },
    },
    take: 100,
  });

  let processed = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    if (!reminder.invoice || reminder.invoice.status === "PAID" || reminder.invoice.status === "CANCELLED") {
      await prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
      processed++;
      continue;
    }

    try {
      if (reminder.tenant.email && reminder.invoice) {
        await sendPaymentReminderEmail(
          reminder.tenant.email,
          reminder.tenant.name,
          reminder.invoice.invoiceNumber,
          Number(reminder.invoice.totalAmount),
          reminder.invoice.dueDate,
          reminder.tenant.slug
        );
      }
      await prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: { sentAt: now },
      });
      processed++;
    } catch (err) {
      console.error(`Failed to send reminder ${reminder.id}:`, err);
      failed++;
    }
  }

  return { processed, failed };
}



