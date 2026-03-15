import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, dbSchema } from "@/db";
import { env } from "@/lib/env";
import { requireServerSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await requireServerSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(dbSchema.subscriptions.userId, session.user.id),
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "no_customer" },
      { status: 404 },
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.appUrl}/account`,
  });

  return NextResponse.json({
    url: portalSession.url,
  });
}
