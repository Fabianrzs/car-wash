import { NextResponse } from "next/server";
import { processScheduledPlanChangesService } from "@/modules/cron/services/plan-changes.service";

// Called by cron job to apply scheduled plan changes
export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processScheduledPlanChangesService();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing plan changes:", error);
    return NextResponse.json({ error: "Error processing plan changes" }, { status: 500 });
  }
}
