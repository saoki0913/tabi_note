import { NextResponse } from "next/server";
import type { Trip } from "@/types/trip";
import { renderPage, type DpiLevel, PAGE_DIMENSIONS } from "@/lib/export/render";

export const maxDuration = 60; // Allow longer execution for rendering

interface ExportPngRequest {
  trip: Trip;
  pageId: string;
  dpi?: DpiLevel;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportPngRequest;

    if (!body.trip) {
      return NextResponse.json(
        { error: "Trip data is required" },
        { status: 400 }
      );
    }

    if (!body.pageId) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      );
    }

    const dpi: DpiLevel = body.dpi || "print";

    // Find the page
    const page = body.trip.design?.pages?.find((p) => p.id === body.pageId);
    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Render the page
    const result = await renderPage(page, body.trip, dpi);
    const dimensions = PAGE_DIMENSIONS[dpi];

    return NextResponse.json({
      base64: result.base64,
      mimeType: result.mimeType,
      width: dimensions.width,
      height: dimensions.height,
      pageId: body.pageId,
      dpi,
    });
  } catch (error) {
    console.error("PNG export error:", error);
    return NextResponse.json(
      { error: "Failed to export PNG", detail: String(error) },
      { status: 500 }
    );
  }
}
