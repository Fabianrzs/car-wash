import Stripe from "stripe";
import { prisma } from "@/database/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * Process a Stripe webhook event.
 */
export async function processStripeEventService(
  rawBody: string,
  signature: string
): Promise<void> {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      if (tenantId && session.customer && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price?.id;
        let planId: string | undefined;
        if (priceId) {
          const plan = await prisma.plan.findFirst({ where: { stripePriceId: priceId } });
          if (plan) planId = plan.id;
        }
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            isActive: true,
            ...(planId ? { plan: { connect: { id: planId } }, trialEndsAt: null } : {}),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tenant = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (tenant) {
        const isActive = sub.status === "active" || sub.status === "trialing";
        await prisma.tenant.update({ where: { id: tenant.id }, data: { isActive } });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const tenant = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (tenant) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { isActive: false, stripeSubscriptionId: null, plan: { disconnect: true } },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.customer) {
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: inv.customer as string },
        });
        if (tenant) console.warn(`Stripe payment failed for tenant ${tenant.slug}`);
      }
      break;
    }
  }
}

