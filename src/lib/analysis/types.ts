// Analysis result types for Gemini Vision API

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ZoneType =
  | "title"
  | "subtitle"
  | "body"
  | "date"
  | "members"
  | "list-item"
  | "caption"
  | "label";

export interface TextRegion {
  id: string;
  bounds: Bounds;
  content: string;
  style: {
    fontSize: number;
    fontWeight: number;
    color: string;
    alignment: "left" | "center" | "right";
  };
  zoneType: ZoneType;
  confidence: number;
}

export interface ImageSlot {
  id: string;
  bounds: Bounds;
  type: "hero" | "thumbnail" | "icon";
  isEmpty: boolean;
  shape: "rectangle" | "circle" | "rounded";
  confidence: number;
}

export interface AnalysisResult {
  textRegions: TextRegion[];
  imageSlots: ImageSlot[];
  pageSize: {
    width: number;
    height: number;
  };
  analyzedAt: string;
}

export interface AnalysisRequest {
  imageBase64: string;
  mimeType: string;
  pageMode: string;
  day?: number;
}

export interface AnalysisError {
  code: string;
  message: string;
}

// Default image size for A4 shiori at high resolution
export const DEFAULT_ANALYSIS_IMAGE_SIZE = {
  width: 2480,
  height: 3508,
};

// Canvas size (A4 at 72 DPI)
export const CANVAS_SIZE = {
  width: 595,
  height: 842,
};

// Scale factor from analysis image to canvas
export function getScaleFactor(): { x: number; y: number } {
  return {
    x: CANVAS_SIZE.width / DEFAULT_ANALYSIS_IMAGE_SIZE.width,
    y: CANVAS_SIZE.height / DEFAULT_ANALYSIS_IMAGE_SIZE.height,
  };
}

// Convert bounds from high-res to canvas coordinates
export function scaleToCanvas(bounds: Bounds): Bounds {
  const scale = getScaleFactor();
  return {
    x: Math.round(bounds.x * scale.x),
    y: Math.round(bounds.y * scale.y),
    width: Math.round(bounds.width * scale.x),
    height: Math.round(bounds.height * scale.y),
  };
}
