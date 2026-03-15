import { NextResponse } from "next/server";
import { bumpUsage, listTripsForUser, resolveEntitlementsForSubject, saveTripForUser } from "@/lib/booklets";
import { requireServerSession } from "@/lib/session";
import { ensureVisitorId } from "@/lib/visitor";
import type { Trip } from "@/types/trip";

type PostBody =
  | { action: "reserve-generation" }
  | { action: "save"; trip: Trip };

export async function GET() {
  const session = await requireServerSession();
  const visitorId = ensureVisitorId();
  const entitlements = await resolveEntitlementsForSubject({
    userId: session?.user.id,
    visitorId,
  });

  if (!session?.user.id) {
    return NextResponse.json({
      entitlements,
      trips: [],
    });
  }

  const trips = await listTripsForUser(session.user.id);
  return NextResponse.json({
    entitlements,
    trips,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as PostBody;
  const session = await requireServerSession();
  const visitorId = ensureVisitorId();

  if (body.action === "reserve-generation") {
    const entitlements = await resolveEntitlementsForSubject({
      userId: session?.user.id,
      visitorId,
    });

    if (!entitlements.canGenerate) {
      return NextResponse.json(
        {
          error: "free_limit_reached",
          entitlements,
        },
        { status: 402 },
      );
    }

    const usage = await bumpUsage({
      subjectType: session?.user.id ? "user" : "guest",
      subjectId: session?.user.id ?? visitorId,
      kind: "generation",
    });

    return NextResponse.json({
      ok: true,
      usage,
      entitlements: await resolveEntitlementsForSubject({
        userId: session?.user.id,
        visitorId,
      }),
    });
  }

  if (body.action === "save") {
    if (!session?.user.id) {
      return NextResponse.json(
        { error: "authentication_required" },
        { status: 401 },
      );
    }

    const savedTrip = await saveTripForUser(body.trip, session.user.id);
    return NextResponse.json({
      trip: savedTrip,
    });
  }

  return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
}
