import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, dbSchema } from "@/db";
import { env, hasStripeConfig } from "@/lib/env";
import { requireServerSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await requireServerSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  }

  if (!stripe || !hasStripeConfig) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { billingCycle?: "monthly" | "yearly" };
  const priceId =
    body.billingCycle === "yearly"
      ? env.stripeYearlyPriceId
      : env.stripeMonthlyPriceId;

  if (!priceId) {
    return NextResponse.json({ error: "missing_price_id" }, { status: 500 });
  }

  const existing = await db.query.subscriptions.findFirst({
    where: eq(dbSchema.subscriptions.userId, session.user.id),
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existing?.stripeCustomerId ?? undefined,
    success_url: `${env.appUrl}/pricing?checkout=success`,
    cancel_url: `${env.appUrl}/pricing?checkout=cancelled`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    client_reference_id: session.user.id,
    customer_email: session.user.email,
    metadata: {
      userId: session.user.id,
      billingCycle: body.billingCycle ?? "monthly",
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({
    url: checkout.url,
  });
}
