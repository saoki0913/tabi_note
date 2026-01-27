/**
 * Server-side rendering utilities using Satori and Resvg
 *
 * This module handles high-quality rendering of layered pages to PNG images.
 * It combines background images with HTML text layers for print-quality output.
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { TripDesignPage, TextLayer, Trip } from "@/types/trip";
import { loadDefaultFonts, type FontData } from "./fonts";

// A4 dimensions at different DPIs
export const PAGE_DIMENSIONS = {
  // 72 DPI (screen)
  screen: { width: 595, height: 842 },
  // 150 DPI (web export)
  web: { width: 1240, height: 1754 },
  // 300 DPI (print)
  print: { width: 2480, height: 3508 },
} as const;

export type DpiLevel = keyof typeof PAGE_DIMENSIONS;

// Font cache for reuse across renders
let fontCache: FontData[] | null = null;

/**
 * Get or load fonts with caching
 */
async function getFonts(): Promise<FontData[]> {
  if (!fontCache) {
    fontCache = await loadDefaultFonts();
  }
  return fontCache;
}

/**
 * Clear the font cache (for memory management)
 */
export function clearRenderCache(): void {
  fontCache = null;
}

/**
 * Build JSX element for a layered page
 */
function buildPageJsx(
  page: TripDesignPage,
  trip: Trip,
  dimensions: { width: number; height: number }
): React.ReactElement {
  const { width, height } = dimensions;
  const textLayers = page.textLayers || [];

  // Background image as base64 data URI
  const backgroundSrc = `data:${page.mimeType};base64,${page.base64}`;

  // Build text layer elements
  const textElements = textLayers.map((layer) => {
    const layerStyle = buildLayerStyle(layer, width, height);

    return {
      type: "div",
      key: layer.id,
      props: {
        style: layerStyle,
        children: layer.content,
      },
    };
  });

  // Build the complete page structure
  return {
    type: "div",
    props: {
      style: {
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#ffffff",
        overflow: "hidden",
      },
      children: [
        // Background image
        {
          type: "img",
          props: {
            src: backgroundSrc,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            },
          },
        },
        // Text layers
        ...textElements,
      ],
    },
  } as unknown as React.ReactElement;
}

/**
 * Build CSS style object for a text layer
 */
function buildLayerStyle(
  layer: TextLayer,
  canvasWidth: number,
  canvasHeight: number
): Record<string, string | number | undefined> {
  // Convert normalized coordinates to pixel values
  const x = layer.position.x * canvasWidth;
  const y = layer.position.y * canvasHeight;
  const width = layer.size.width * canvasWidth;
  const height = layer.size.height * canvasHeight;

  // Scale font size based on canvas size
  // Base is 595px width (72 DPI), scale proportionally
  const fontScale = canvasWidth / 595;
  const fontSize = Math.round(layer.style.fontSize * fontScale);

  // Build base style object
  const style: Record<string, string | number | undefined> = {
    position: "absolute",
    left: `${Math.round(x)}px`,
    top: `${Math.round(y)}px`,
    width: `${Math.round(width)}px`,
    minHeight: `${Math.round(height)}px`,
    fontSize: `${fontSize}px`,
    fontFamily: layer.style.fontFamily,
    fontWeight: layer.style.fontWeight,
    color: layer.style.color,
    textAlign: layer.style.alignment,
    lineHeight: layer.style.lineHeight,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  };

  // Add optional styles only if they have values
  if (layer.style.letterSpacing) {
    style.letterSpacing = `${layer.style.letterSpacing}px`;
  }
  if (layer.style.backgroundColor) {
    style.backgroundColor = layer.style.backgroundColor;
  }
  if (layer.style.padding) {
    style.padding = `${layer.style.padding * fontScale}px`;
  }
  if (layer.style.borderRadius) {
    style.borderRadius = `${layer.style.borderRadius * fontScale}px`;
  }
  if (layer.opacity !== undefined && layer.opacity !== 1) {
    style.opacity = layer.opacity;
  }
  if (layer.rotation) {
    style.transform = `rotate(${layer.rotation}deg)`;
  }

  return style;
}

/**
 * Render a layered page to SVG using Satori
 */
export async function renderPageToSvg(
  page: TripDesignPage,
  trip: Trip,
  dpi: DpiLevel = "print"
): Promise<string> {
  const fonts = await getFonts();
  const dimensions = PAGE_DIMENSIONS[dpi];

  const jsx = buildPageJsx(page, trip, dimensions);

  const svg = await satori(jsx, {
    width: dimensions.width,
    height: dimensions.height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight as 400 | 500 | 600 | 700,
      style: f.style,
    })),
  });

  return svg;
}

/**
 * Render a layered page to PNG using Satori + Resvg
 */
export async function renderPageToPng(
  page: TripDesignPage,
  trip: Trip,
  dpi: DpiLevel = "print"
): Promise<Buffer> {
  const svg = await renderPageToSvg(page, trip, dpi);
  const dimensions = PAGE_DIMENSIONS[dpi];

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: dimensions.width,
    },
    font: {
      loadSystemFonts: false,
    },
    imageRendering: 1, // crisp-edges
    textRendering: 0, // optimizeLegibility
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

/**
 * Render multiple pages to PNG buffers
 */
export async function renderPagesToPng(
  pages: TripDesignPage[],
  trip: Trip,
  dpi: DpiLevel = "print"
): Promise<Buffer[]> {
  // Render pages sequentially to avoid memory issues
  const pngBuffers: Buffer[] = [];

  for (const page of pages) {
    const png = await renderPageToPng(page, trip, dpi);
    pngBuffers.push(png);
  }

  return pngBuffers;
}

/**
 * Render a layered page to base64 PNG string
 */
export async function renderPageToBase64(
  page: TripDesignPage,
  trip: Trip,
  dpi: DpiLevel = "print"
): Promise<{ base64: string; mimeType: string; width: number; height: number }> {
  const pngBuffer = await renderPageToPng(page, trip, dpi);
  const dimensions = PAGE_DIMENSIONS[dpi];

  return {
    base64: pngBuffer.toString("base64"),
    mimeType: "image/png",
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Simple fallback render for legacy pages (just return the existing image)
 */
export async function renderLegacyPage(
  page: TripDesignPage
): Promise<{ base64: string; mimeType: string }> {
  return {
    base64: page.base64,
    mimeType: page.mimeType,
  };
}

/**
 * Render a page (layered or legacy) to PNG
 */
export async function renderPage(
  page: TripDesignPage,
  trip: Trip,
  dpi: DpiLevel = "print"
): Promise<{ base64: string; mimeType: string; width: number; height: number }> {
  // For layered pages, use Satori + Resvg rendering
  if (page.renderType === "layered" && page.textLayers) {
    return renderPageToBase64(page, trip, dpi);
  }

  // For legacy pages, return the existing image
  // Note: Could add upscaling here if needed
  const dimensions = PAGE_DIMENSIONS[dpi];
  return {
    base64: page.base64,
    mimeType: page.mimeType,
    width: dimensions.width,
    height: dimensions.height,
  };
}
