import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        if (tenantId && session.customer && session.subscription) {
          // Look up the plan by the subscription's price ID
          const stripe = getStripe();
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price?.id;

          let planId: string | undefined;
          if (priceId) {
            const plan = await prisma.plan.findFirst({
              where: { stripePriceId: priceId },
            });
            if (plan) {
              planId = plan.id;
            }
          }

          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              isActive: true,
              ...(planId
                ? {
                    plan: { connect: { id: planId } },
                    trialEndsAt: null,
                  }
                : {}),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (tenant) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { isActive },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              isActive: false,
              stripeSubscriptionId: null,
              plan: { disconnect: true },
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Payment successful — tenant stays active
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          const tenant = await prisma.tenant.findFirst({
            where: { stripeCustomerId: invoice.customer as string },
          });
          if (tenant) {
            console.warn(`Payment failed for tenant ${tenant.slug}`);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
