import { NextResponse } from "next/server";
import { processPaymentRemindersService } from "@/modules/cron/services/reminders.service";

// Called by cron job to process pending reminders
// Should be protected by a secret in production
export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processPaymentRemindersService();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing reminders:", error);
    return NextResponse.json({ error: "Error processing reminders" }, { status: 500 });
  }
}
