// Overview page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const overviewVariants: LayoutVariant[] = [
  {
    id: "centered",
    name: "Centered",
    nameJa: "中央配置",
    description: "Classic centered layout with header and overview text in the middle",
    promptHint: `Layout: Center-aligned overview page.
- Small decorative header banner at top with "旅のプラン" text area
- Main overview text area centered in upper-middle section
- Large open space below for decorative illustrations
- Corner ornaments or travel-themed decorations
- Soft background texture (paper, watercolor wash)
- Keep text areas clear and readable`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.10, y: 0.02, width: 0.80, height: 0.08, label: "header" },
      { x: 0.08, y: 0.11, width: 0.84, height: 0.18, label: "overview-text" },
    ],
  },
  {
    id: "left-panel",
    name: "Left Panel",
    nameJa: "左パネル",
    description: "Text content aligned to left with decorative right side",
    promptHint: `Layout: Left-aligned editorial overview.
- Header text "旅のプラン" on left side
- Overview text area as left-aligned block (60% width)
- Right side (40%) reserved for decorative illustration
- Vertical accent line separating text and illustration areas
- Travel-themed sketches or icons on right
- Clean, magazine-style composition`,
    weight: 2,
    zoneOverrides: {
      "header": {
        position: { x: 40, y: 20, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "overview-text": {
        position: { x: 40, y: 100, anchor: "topLeft" },
        size: { width: 320, height: 150 },
        defaultStyle: { alignment: "left" },
      },
    },
    safeZones: [
      { x: 0.05, y: 0.02, width: 0.55, height: 0.08, label: "header" },
      { x: 0.05, y: 0.11, width: 0.55, height: 0.22, label: "overview-text" },
    ],
  },
  {
    id: "bottom-heavy",
    name: "Bottom Heavy",
    nameJa: "下部集約",
    description: "Large illustration at top with text content at bottom",
    promptHint: `Layout: Top illustration, bottom text.
- Large decorative illustration or photo frame in upper 60%
- Header "旅のプラン" below illustration
- Overview text area at bottom third
- Creates postcard-like composition
- Decorative border or frame around illustration area
- Warm, inviting travel atmosphere`,
    weight: 2,
    zoneOverrides: {
      "header": {
        position: { x: "center", y: 520, anchor: "topCenter" },
      },
      "overview-text": {
        position: { x: "center", y: 580, anchor: "topCenter" },
        size: { width: 500, height: 180 },
      },
    },
    safeZones: [
      { x: 0.10, y: 0.60, width: 0.80, height: 0.08, label: "header" },
      { x: 0.08, y: 0.68, width: 0.84, height: 0.25, label: "overview-text" },
    ],
  },
];

// Select a variant based on weighted random selection
export function selectOverviewVariant(seed?: number): LayoutVariant {
  const totalWeight = overviewVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = seed !== undefined
    ? (seed % 100) / 100
    : Math.random();
  let accumulated = 0;

  for (const variant of overviewVariants) {
    accumulated += variant.weight / totalWeight;
    if (random <= accumulated) {
      return variant;
    }
  }

  return overviewVariants[0];
}

// Get variant by ID
export function getOverviewVariant(id: string): LayoutVariant | undefined {
  return overviewVariants.find((v) => v.id === id);
}
