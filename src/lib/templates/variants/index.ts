export * from "./cover";
export * from "./schedule";

import { LayoutVariant, selectCoverVariant, getCoverVariant } from "./cover";
import { selectScheduleVariant, getScheduleVariant } from "./schedule";
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
    default:
      return undefined;
  }
}
