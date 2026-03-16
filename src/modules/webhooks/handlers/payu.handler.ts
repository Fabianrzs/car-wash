import { NextResponse } from "next/server";
import { processPayUConfirmationService } from "@/modules/webhooks/services/payu-webhook.service";

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

    await processPayUConfirmationService(data);

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Firma PayU")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.error("Error processing PayU webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// PayU also does GET for confirmation page redirect
export async function GET(request: Request) {
  return NextResponse.json({ status: "ok" });
}
