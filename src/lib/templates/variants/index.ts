export * from "./cover";
export * from "./schedule";
export * from "./overview";
export * from "./checklist";
export * from "./info";
export * from "./memo";

import type { LayoutVariant, SafeZone } from "./cover";
import { selectCoverVariant, getCoverVariant } from "./cover";

// Re-export types
export type { LayoutVariant, SafeZone };
import { selectScheduleVariant, getScheduleVariant } from "./schedule";
import { selectOverviewVariant, getOverviewVariant } from "./overview";
import { selectChecklistVariant, getChecklistVariant } from "./checklist";
import { selectInfoVariant, getInfoVariant } from "./info";
import { selectMemoVariant, getMemoVariant } from "./memo";
import { DesignMode } from "@/types/trip";

// Select a variant for the given mode
export function selectVariantForMode(
  mode: DesignMode,
  seed?: number
): LayoutVariant | null {
  switch (mode) {
    case "cover":
      return selectCoverVariant(seed);
    case "schedule":
      return selectScheduleVariant(seed);
    case "overview":
      return selectOverviewVariant(seed);
    case "checklist":
      return selectChecklistVariant(seed);
    case "info":
      return selectInfoVariant(seed);
    case "memo":
      return selectMemoVariant(seed);
    default:
      return null;
  }
}

// Get a specific variant for the given mode
export function getVariantForMode(
  mode: DesignMode,
  variantId: string
): LayoutVariant | undefined {
  switch (mode) {
    case "cover":
      return getCoverVariant(variantId);
    case "schedule":
      return getScheduleVariant(variantId);
    case "overview":
      return getOverviewVariant(variantId);
    case "checklist":
      return getChecklistVariant(variantId);
    case "info":
      return getInfoVariant(variantId);
    case "memo":
      return getMemoVariant(variantId);
    default:
      return undefined;
  }
}
