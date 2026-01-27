import { NextResponse } from "next/server";
import type { Trip } from "@/types/trip";
import {
  generatePdfBase64,
  type PaperSize,
  type Orientation,
  type DpiLevel,
  estimatePdfSize,
} from "@/lib/export";

export const maxDuration = 120; // Allow longer execution for multi-page PDF

interface ExportPdfRequest {
  trip: Trip;
  pageIds?: string[];
  paperSize?: PaperSize;
  orientation?: Orientation;
  dpi?: DpiLevel;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportPdfRequest;

    if (!body.trip) {
      return NextResponse.json(
        { error: "Trip data is required" },
        { status: 400 }
      );
    }

    const allPages = body.trip.design?.pages || [];
    if (allPages.length === 0) {
      return NextResponse.json(
        { error: "No pages to export" },
        { status: 400 }
      );
    }

    // Get pages to export
    const pages = body.pageIds
      ? allPages.filter((p) => body.pageIds!.includes(p.id))
      : allPages;

    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No matching pages found" },
        { status: 404 }
      );
    }

    // Sort by page number
    const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

    // Generate PDF
    const { base64, filename } = await generatePdfBase64(
      sortedPages,
      body.trip,
      {
        paperSize: body.paperSize || "a4",
        orientation: body.orientation || "portrait",
        dpi: body.dpi || "print",
        title: body.trip.title || "旅のしおり",
      }
    );

    return NextResponse.json({
      pdf: base64,
      filename,
      pageCount: sortedPages.length,
      estimatedSize: estimatePdfSize(sortedPages.length, body.dpi || "print"),
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to export PDF", detail: String(error) },
      { status: 500 }
    );
  }
}
