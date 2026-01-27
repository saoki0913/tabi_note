import { DesignMode, TemplateType, FormatType } from "@/types/trip";
import {
  BaseTemplate,
  FormatModifier,
  PageLayout,
  TemplateDefinition,
  LayoutZone,
  Position,
  Size,
} from "@/types/editor";

// Re-export types for convenience
export type {
  BaseTemplate,
  FormatModifier,
  PageLayout,
  TemplateDefinition,
  LayoutZone,
  Position,
  Size,
};

// Template registry
export interface TemplateRegistry {
  bases: Record<TemplateType, BaseTemplate>;
  formats: Record<FormatType, FormatModifier>;
  pages: Record<DesignMode, PageLayout>;
}

// Zone position resolver
export function resolveZonePosition(
  zone: LayoutZone,
  canvasWidth: number,
  canvasHeight: number
): Position {
  let x: number;
  let y: number;

  // Resolve X
  if (typeof zone.position.x === "number") {
    x = zone.position.x;
  } else {
    switch (zone.position.x) {
      case "left":
        x = 40;
        break;
      case "center":
        x = canvasWidth / 2;
        break;
      case "right":
        x = canvasWidth - 40;
        break;
      default:
        x = 0;
    }
  }

  // Resolve Y
  if (typeof zone.position.y === "number") {
    y = zone.position.y;
  } else {
    switch (zone.position.y) {
      case "top":
        y = 40;
        break;
      case "middle":
        y = canvasHeight / 2;
        break;
      case "bottom":
        y = canvasHeight - 40;
        break;
      default:
        y = 0;
    }
  }

  // Apply anchor offset
  const resolvedSize = resolveZoneSize(zone, canvasWidth, canvasHeight);
  switch (zone.position.anchor) {
    case "topCenter":
      x -= resolvedSize.width / 2;
      break;
    case "topRight":
      x -= resolvedSize.width;
      break;
    case "centerLeft":
      y -= resolvedSize.height / 2;
      break;
    case "center":
      x -= resolvedSize.width / 2;
      y -= resolvedSize.height / 2;
      break;
    case "centerRight":
      x -= resolvedSize.width;
      y -= resolvedSize.height / 2;
      break;
    case "bottomLeft":
      y -= resolvedSize.height;
      break;
    case "bottomCenter":
      x -= resolvedSize.width / 2;
      y -= resolvedSize.height;
      break;
    case "bottomRight":
      x -= resolvedSize.width;
      y -= resolvedSize.height;
      break;
    // topLeft is default, no adjustment needed
  }

  return { x, y };
}

// Zone size resolver
export function resolveZoneSize(
  zone: LayoutZone,
  canvasWidth: number,
  canvasHeight: number
): Size {
  let width: number;
  let height: number;

  // Resolve width
  if (typeof zone.size.width === "number") {
    width = zone.size.width;
  } else if (zone.size.width === "fill") {
    width = canvasWidth - 80; // 40px margin on each side
  } else {
    width = 200; // auto default
  }

  // Resolve height
  if (typeof zone.size.height === "number") {
    height = zone.size.height;
  } else if (zone.size.height === "fill") {
    height = canvasHeight - 80;
  } else {
    height = 50; // auto default
  }

  // Apply constraints
  if (zone.size.minWidth) width = Math.max(width, zone.size.minWidth);
  if (zone.size.maxWidth) width = Math.min(width, zone.size.maxWidth);
  if (zone.size.minHeight) height = Math.max(height, zone.size.minHeight);
  if (zone.size.maxHeight) height = Math.min(height, zone.size.maxHeight);

  return { width, height };
}

// Merge template components into a full definition
export function mergeTemplate(
  base: BaseTemplate,
  format: FormatModifier,
  layout: PageLayout
): TemplateDefinition {
  return {
    base,
    format,
    layout,
  };
}

// Get template colors with format adjustments
export function getTemplateColors(base: BaseTemplate): BaseTemplate["colors"] {
  return base.colors;
}

// Generate unique element ID
export function generateElementId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
