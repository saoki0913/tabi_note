import { NextResponse } from "next/server";
import { generatePdfBase64 } from "@/lib/export";
import { getTripById, resolveEntitlementsForSubject } from "@/lib/booklets";
import { requireServerSession } from "@/lib/session";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: RouteContext) {
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

  if (!entitlements.canExportPdf) {
    return NextResponse.json(
      { error: "premium_required", entitlements },
      { status: 402 },
    );
  }

  const trip = await getTripById(params.id, session.user.id);
  if (!trip) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    paperSize?: "a4" | "a5" | "bookmark";
    orientation?: "portrait" | "landscape";
  };

  const pages = [...(trip.design?.pages ?? [])].sort(
    (left, right) => left.pageNumber - right.pageNumber,
  );

  const { base64, filename } = await generatePdfBase64(pages, trip, {
    paperSize: body.paperSize ?? "a4",
    orientation: body.orientation ?? "portrait",
    dpi: "print",
    title: trip.title,
  });

  return NextResponse.json({
    pdf: base64,
    filename,
  });
}
