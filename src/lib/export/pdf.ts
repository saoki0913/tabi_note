/**
 * PDF generation utilities using pdf-lib
 *
 * This module handles assembling multiple page images into a single PDF document.
 */

import { PDFDocument } from "pdf-lib";
import type { TripDesignPage, Trip } from "@/types/trip";
import { renderPage, type DpiLevel } from "./render";

// Paper size configurations
export const PAPER_SIZES = {
  a4: {
    name: "A4",
    width: 595.28, // 210mm in points (72 DPI)
    height: 841.89, // 297mm in points
  },
  a5: {
    name: "A5",
    width: 419.53, // 148mm in points
    height: 595.28, // 210mm in points
  },
  bookmark: {
    name: "しおり",
    width: 141.73, // 50mm in points
    height: 425.20, // 150mm in points
  },
} as const;

export type PaperSize = keyof typeof PAPER_SIZES;
export type Orientation = "portrait" | "landscape";

export interface PdfOptions {
  paperSize?: PaperSize;
  orientation?: Orientation;
  dpi?: DpiLevel;
  title?: string;
  author?: string;
  subject?: string;
}

const DEFAULT_PDF_OPTIONS: Required<PdfOptions> = {
  paperSize: "a4",
  orientation: "portrait",
  dpi: "print",
  title: "旅のしおり",
  author: "Tabi Note",
  subject: "Travel Booklet",
};

/**
 * Get page dimensions in PDF points based on paper size and orientation
 */
function getPdfPageSize(
  paperSize: PaperSize,
  orientation: Orientation
): [number, number] {
  const size = PAPER_SIZES[paperSize];
  const width = orientation === "landscape" ? size.height : size.width;
  const height = orientation === "landscape" ? size.width : size.height;
  return [width, height];
}

/**
 * Generate a PDF from multiple pages
 */
export async function generatePdf(
  pages: TripDesignPage[],
  trip: Trip,
  options: PdfOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_PDF_OPTIONS, ...options };

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Set document metadata
  pdfDoc.setTitle(opts.title || trip.title || "旅のしおり");
  pdfDoc.setAuthor(opts.author);
  pdfDoc.setSubject(opts.subject);
  pdfDoc.setCreator("Tabi Note - AI Travel Booklet Generator");
  pdfDoc.setProducer("pdf-lib");
  pdfDoc.setCreationDate(new Date());

  // Get page size
  const [pageWidth, pageHeight] = getPdfPageSize(opts.paperSize, opts.orientation);

  // Process each page
  for (const page of pages) {
    // Render the page to PNG
    const { base64, mimeType } = await renderPage(page, trip, opts.dpi);

    // Embed the image in the PDF
    let image;
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      image = await pdfDoc.embedJpg(Buffer.from(base64, "base64"));
    } else {
      // Default to PNG
      image = await pdfDoc.embedPng(Buffer.from(base64, "base64"));
    }

    // Add a page
    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate image dimensions to fit the page while maintaining aspect ratio
    const imageAspect = image.width / image.height;
    const pageAspect = pageWidth / pageHeight;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (imageAspect > pageAspect) {
      // Image is wider than page - fit to width
      drawWidth = pageWidth;
      drawHeight = pageWidth / imageAspect;
      drawX = 0;
      drawY = (pageHeight - drawHeight) / 2;
    } else {
      // Image is taller than page - fit to height
      drawHeight = pageHeight;
      drawWidth = pageHeight * imageAspect;
      drawX = (pageWidth - drawWidth) / 2;
      drawY = 0;
    }

    // Draw the image on the page
    pdfPage.drawImage(image, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a PDF from selected page IDs
 */
export async function generatePdfFromPageIds(
  trip: Trip,
  pageIds?: string[],
  options: PdfOptions = {}
): Promise<Buffer> {
  const allPages = trip.design?.pages || [];

  // If specific page IDs provided, filter to those
  const pages = pageIds
    ? allPages.filter((p) => pageIds.includes(p.id))
    : allPages;

  // Sort by page number
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return generatePdf(sortedPages, trip, options);
}

/**
 * Generate a PDF and return as base64 string
 */
export async function generatePdfBase64(
  pages: TripDesignPage[],
  trip: Trip,
  options: PdfOptions = {}
): Promise<{ base64: string; filename: string }> {
  const pdfBuffer = await generatePdf(pages, trip, options);

  // Generate filename
  const tripTitle = trip.title?.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_") || "shiori";
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `${tripTitle}_${timestamp}.pdf`;

  return {
    base64: pdfBuffer.toString("base64"),
    filename,
  };
}

/**
 * Get estimated PDF file size based on page count and DPI
 */
export function estimatePdfSize(pageCount: number, dpi: DpiLevel): string {
  // Rough estimates based on typical page sizes
  const sizePerPage: Record<DpiLevel, number> = {
    screen: 200_000, // ~200KB per page at 72 DPI
    web: 800_000, // ~800KB per page at 150 DPI
    print: 2_500_000, // ~2.5MB per page at 300 DPI
  };

  const totalBytes = pageCount * sizePerPage[dpi];

  if (totalBytes < 1_000_000) {
    return `${Math.round(totalBytes / 1000)}KB`;
  }
  return `${(totalBytes / 1_000_000).toFixed(1)}MB`;
}
