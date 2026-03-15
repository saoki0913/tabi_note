import { NextResponse } from "next/server";
import { ensureShareLink, getTripById, resolveEntitlementsForSubject } from "@/lib/booklets";
import { requireServerSession } from "@/lib/session";

interface RouteContext {
  params: {
    id: string;
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

  const entitlements = await resolveEntitlementsForSubject({
    userId: session.user.id,
  });

  if (!entitlements.canShare) {
    return NextResponse.json(
      { error: "premium_required", entitlements },
      { status: 402 },
    );
  }

  const trip = await getTripById(params.id, session.user.id);
  if (!trip) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const token = await ensureShareLink({
    bookletId: params.id,
    userId: session.user.id,
  });

  return NextResponse.json({
    shareToken: token,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/share/${token}`,
  });
}
