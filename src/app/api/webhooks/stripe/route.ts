import { NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertSubscription } from "@/lib/booklets";
import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";

const toDate = (value?: number | null) => (value ? new Date(value * 1000) : null);

const syncSubscription = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  await upsertSubscription({
    userId,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id ?? null,
    plan:
      subscription.items.data[0]?.price.id === env.stripeYearlyPriceId
        ? "premium-yearly"
        : "premium-monthly",
    status: subscription.status,
    currentPeriodEnd: toDate(subscription.items.data[0]?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
};

export async function POST(request: Request) {
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "invalid_signature",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const userId = checkout.metadata?.userId ?? checkout.client_reference_id;
      const customerId =
        typeof checkout.customer === "string"
          ? checkout.customer
          : checkout.customer?.id;

      if (userId) {
        await upsertSubscription({
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId:
            typeof checkout.subscription === "string"
              ? checkout.subscription
              : checkout.subscription?.id,
          stripePriceId: checkout.line_items?.data?.[0]?.price?.id ?? null,
          plan:
            checkout.metadata?.billingCycle === "yearly"
              ? "premium-yearly"
              : "premium-monthly",
          status: "active",
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
