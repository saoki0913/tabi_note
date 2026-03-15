import { NextResponse } from "next/server";
import { getTripById } from "@/lib/booklets";
import { requireServerSession } from "@/lib/session";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
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

  return NextResponse.json({ trip });
}
