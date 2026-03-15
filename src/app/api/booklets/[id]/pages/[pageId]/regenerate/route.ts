import { NextResponse } from "next/server";
import { bumpUsage, getTripById, resolveEntitlementsForSubject } from "@/lib/booklets";
import { requireServerSession } from "@/lib/session";

interface RouteContext {
  params: {
    id: string;
    pageId: string;
  };
}

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await requireServerSession();
  if (!session?.user.id) {
    return NextResponse.json(
      { error: "authentication_required" },
      { status: 401 },
    );
  }

  const trip = await getTripById(params.id, session.user.id);
  if (!trip) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const entitlements = await resolveEntitlementsForSubject({
    userId: session.user.id,
  });

  if (!entitlements.canRegeneratePage) {
    return NextResponse.json(
      { error: "premium_required", entitlements },
      { status: 402 },
    );
  }

  const page = trip.design?.pages?.find((item) => item.id === params.pageId);
  if (!page) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }

  const usage = await bumpUsage({
    subjectType: "user",
    subjectId: session.user.id,
    kind: "page-regeneration",
  });

  return NextResponse.json({
    ok: true,
    usage,
    entitlements,
  });
}
