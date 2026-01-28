import type { Trip, TextLayer, TextLayerStyle, ZoneType, DesignMode } from "@/types/trip";
import type { LayoutZone, DataBinding } from "@/types/editor";
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_FONTS } from "@/types/editor";
import { getPageLayout, resolveZonePosition, resolveZoneSize, mergeZoneWithOverrides } from "@/lib/templates";
import type { LayoutVariant } from "@/lib/templates/variants";

// Canvas dimensions for normalization (A4 at 72 DPI)
const NORM_WIDTH = CANVAS_WIDTH;  // 595
const NORM_HEIGHT = CANVAS_HEIGHT; // 842

/**
 * Generate text layers from Trip data for a specific page mode
 * @param trip - The trip data
 * @param mode - The page mode (cover, schedule, etc.)
 * @param day - Optional day number for schedule pages
 * @param variant - Optional layout variant for zone position overrides
 */
export function generateTextLayers(
  trip: Trip,
  mode: DesignMode,
  day?: number,
  variant?: LayoutVariant | null
): TextLayer[] {
  const layout = getPageLayout(mode);
  const layers: TextLayer[] = [];

  for (const baseZone of layout.zones) {
    // Apply variant-specific zone overrides if available
    const zone = variant?.zoneOverrides?.[baseZone.id]
      ? mergeZoneWithOverrides(baseZone, variant.zoneOverrides[baseZone.id])
      : baseZone;

    // Skip image zones and header/footer decorations without text content
    if (zone.type === "image") continue;

    // Find data binding for this zone
    const binding = layout.dataBindings.find(b => b.zoneId === zone.id);

    // For list zones, check if we should create individual layers
    if (zone.type === "list" && binding) {
      const rawValue = getValueByPath(trip, binding.tripPath, day);
      if (Array.isArray(rawValue) && rawValue.length > 0) {
        // Create individual TextLayer for each list item
        const position = resolveZonePosition(zone, NORM_WIDTH, NORM_HEIGHT);
        const size = resolveZoneSize(zone, NORM_WIDTH, NORM_HEIGHT);
        const style = createLayerStyle(zone, trip);
        const fontSize = style.fontSize || 14;
        const lineSpacing = fontSize * (style.lineHeight || 1.8);

        rawValue.forEach((item, index) => {
          const itemContent = formatListItem(item, index, binding.tripPath);
          if (!itemContent) return;

          const itemLayer: TextLayer = {
            id: `${zone.id}-item-${index}`,
            zoneType: "list-item",
            content: itemContent,
            position: {
              x: position.x / NORM_WIDTH,
              y: (position.y + index * lineSpacing) / NORM_HEIGHT,
            },
            size: {
              width: size.width / NORM_WIDTH,
              height: lineSpacing / NORM_HEIGHT,
            },
            style,
            locked: zone.locked,
          };
          layers.push(itemLayer);
        });
        continue; // Skip the normal processing for this zone
      }
    }

    const content = binding
      ? resolveDataBinding(binding, trip, mode, day)
      : getDefaultContent(zone, mode, day);

    // Skip if no content
    if (!content || content.trim() === "") continue;

    // Resolve position and size
    const position = resolveZonePosition(zone, NORM_WIDTH, NORM_HEIGHT);
    const size = resolveZoneSize(zone, NORM_WIDTH, NORM_HEIGHT);

    // Create text layer with normalized coordinates (0-1)
    const layer: TextLayer = {
      id: zone.id,
      zoneType: mapZoneType(zone.type),
      content,
      position: {
        x: position.x / NORM_WIDTH,
        y: position.y / NORM_HEIGHT,
      },
      size: {
        width: size.width / NORM_WIDTH,
        height: size.height / NORM_HEIGHT,
      },
      style: createLayerStyle(zone, trip),
      locked: zone.locked,
    };

    layers.push(layer);
  }

  return layers;
}

/**
 * Resolve data binding to get content from Trip
 */
function resolveDataBinding(
  binding: DataBinding,
  trip: Trip,
  mode: DesignMode,
  day?: number
): string {
  // Handle special paths
  if (binding.tripPath === "dates") {
    const value = { startDate: trip.startDate, endDate: trip.endDate };
    return binding.transform
      ? binding.transform(value)
      : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;
  }

  // Navigate the path
  const value = getValueByPath(trip, binding.tripPath, day);

  // Apply transform if exists
  if (binding.transform && value !== undefined) {
    return binding.transform(value);
  }

  // Handle different types
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return formatArrayValue(value, binding.tripPath);

  return String(value);
}

/**
 * Get value from object by dot-notation path
 */
function getValueByPath(obj: unknown, path: string, day?: number): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Handle day-specific data
    if (part === "dayPlan" && day !== undefined) {
      const trip = current as Trip;
      const dayPlan = trip.dayPlans?.find(d => d.day === day);
      current = dayPlan;
      continue;
    }

    // Handle array index in path (e.g., "dayPlans[0]")
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      }
      continue;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Format a single list item for individual TextLayer
 */
function formatListItem(item: unknown, index: number, path: string): string {
  // Handle wantItems array
  if (path.includes("wantItems")) {
    const wantItem = item as { text: string };
    return wantItem.text ? `☐ ${wantItem.text}` : "";
  }

  // Handle activities array
  if (path.includes("activities")) {
    return typeof item === "string" ? `${index + 1}. ${item}` : "";
  }

  // Handle packing suggestions
  if (path.includes("packingSuggestions")) {
    return typeof item === "string" ? `☐ ${item}` : "";
  }

  // Handle lodgings array
  if (path.includes("lodgings")) {
    const lodging = item as { name: string; address?: string; phone?: string };
    return lodging.name || "";
  }

  // Default: convert to string
  return String(item);
}

/**
 * Format array values for display (legacy - used when individual layers are not needed)
 */
function formatArrayValue(arr: unknown[], path: string): string {
  if (arr.length === 0) return "";

  // Handle members array (keep as single text since it's a comma-separated list)
  if (path.includes("members")) {
    return (arr as { name: string }[]).map(m => m.name).join(", ");
  }

  // Handle wantItems array
  if (path.includes("wantItems")) {
    return (arr as { text: string }[]).map(item => `☐ ${item.text}`).join("\n");
  }

  // Handle activities array
  if (path.includes("activities")) {
    return (arr as string[]).map((a, i) => `${i + 1}. ${a}`).join("\n");
  }

  // Handle packing suggestions
  if (path.includes("packingSuggestions")) {
    return (arr as string[]).map(item => `☐ ${item}`).join("\n");
  }

  // Handle lodgings array
  if (path.includes("lodgings")) {
    return (arr as { name: string; address: string; phone: string }[])
      .map(l => `${l.name}\n${l.address || ""}\n${l.phone || ""}`.trim())
      .join("\n\n");
  }

  // Default: join with newlines
  return arr.map(String).join("\n");
}

/**
 * Get default content for zones without data bindings
 */
function getDefaultContent(zone: LayoutZone, mode: DesignMode, day?: number): string {
  switch (zone.id) {
    case "header":
    case "day-header":
      return getHeaderText(mode, day);
    case "header-ornament":
    case "footer-decoration":
      return ""; // Decorations have no text
    default:
      return "";
  }
}

/**
 * Get header text for each mode
 */
function getHeaderText(mode: DesignMode, day?: number): string {
  switch (mode) {
    case "cover":
      return "";
    case "overview":
      return "旅のプラン";
    case "schedule":
      return day !== undefined ? `Day ${day}` : "スケジュール";
    case "checklist":
      return "持ち物チェック";
    case "info":
      return "旅の情報";
    case "memo":
      return "メモ";
    default:
      return "";
  }
}

/**
 * Map LayoutZone type to ZoneType
 */
function mapZoneType(type: LayoutZone["type"]): ZoneType {
  switch (type) {
    case "header":
      return "header";
    case "title":
      return "title";
    case "content":
      return "body";
    case "footer":
      return "footer";
    case "list":
      return "list-item";
    default:
      return "body";
  }
}

/**
 * Create TextLayerStyle from zone and trip template
 * Adds semi-transparent scrim background for body/list zones to improve text readability
 */
function createLayerStyle(zone: LayoutZone, trip: Trip): TextLayerStyle {
  const defaultStyle = zone.defaultStyle || {};

  // Get template colors
  const colors = getTemplateColors(trip.templateType);

  const style: TextLayerStyle = {
    fontSize: (defaultStyle.fontSize as number) || 14,
    fontFamily: (defaultStyle.fontFamily as string) || DEFAULT_FONTS.body,
    fontWeight: (defaultStyle.fontWeight as number) || 400,
    color: (defaultStyle.color as string) || colors.text,
    alignment: (defaultStyle.alignment as "left" | "center" | "right") || "left",
    lineHeight: (defaultStyle.lineHeight as number) || 1.5,
  };

  // Add scrim (semi-transparent background) for body and list zones
  // This improves text readability against potentially busy background images
  if (zone.type === "content" || zone.type === "list") {
    style.backgroundColor = "rgba(255, 255, 255, 0.75)";
    style.padding = 8;
    style.borderRadius = 4;
  }

  return style;
}

/**
 * Get template colors for text
 */
function getTemplateColors(templateType: Trip["templateType"]): {
  text: string;
  muted: string;
  accent: string;
} {
  const colorSchemes: Record<Trip["templateType"], { text: string; muted: string; accent: string }> = {
    minimal: { text: "#1a1a2e", muted: "#6b6b7b", accent: "#c9a227" },
    pop: { text: "#1a1a2e", muted: "#8a8a9a", accent: "#ff6b6b" },
    photo: { text: "#2d2d2d", muted: "#666666", accent: "#e8a87c" },
    retro: { text: "#3d3d3d", muted: "#7a7a7a", accent: "#d4a574" },
    romantic: { text: "#4a4a5a", muted: "#8a8a9a", accent: "#d4a5a5" },
    modern: { text: "#1a1a1a", muted: "#666666", accent: "#3b82f6" },
    nature: { text: "#2d3a2d", muted: "#5a6b5a", accent: "#7c9a6c" },
    adventure: { text: "#3d3d2d", muted: "#6b6b5b", accent: "#b8860b" },
  };

  return colorSchemes[templateType] || colorSchemes.minimal;
}

/**
 * Format date string for display
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Convert pixel coordinates to normalized (0-1) coordinates
 */
export function normalizePosition(
  x: number,
  y: number,
  pageWidth = NORM_WIDTH,
  pageHeight = NORM_HEIGHT
): { x: number; y: number } {
  return {
    x: x / pageWidth,
    y: y / pageHeight,
  };
}

/**
 * Convert normalized coordinates to pixel coordinates
 */
export function denormalizePosition(
  x: number,
  y: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number } {
  return {
    x: x * targetWidth,
    y: y * targetHeight,
  };
}

/**
 * Convert normalized size to pixel size
 */
export function denormalizeSize(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number
): { width: number; height: number } {
  return {
    width: width * targetWidth,
    height: height * targetHeight,
  };
}
