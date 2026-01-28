// Overview page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const overviewVariants: LayoutVariant[] = [
  {
    id: "centered",
    name: "Centered",
    nameJa: "中央配置",
    description: "Classic centered layout with header and overview text in the middle",
    promptHint: `Layout: Center-aligned overview page frame.
- Large empty area at top for header text overlay
- Large empty area in upper-middle for overview text overlay
- Decorative illustrations in lower section and page corners ONLY
- Corner ornaments and travel-themed decorations on page edges ONLY
- Soft background texture (paper, watercolor wash)
- DO NOT draw any text - text will be overlaid`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.01, width: 0.84, height: 0.10, label: "header" },
      { x: 0.06, y: 0.09, width: 0.88, height: 0.22, label: "overview-text" },
    ],
  },
  {
    id: "left-panel",
    name: "Left Panel",
    nameJa: "左パネル",
    description: "Text content aligned to left with decorative right side",
    promptHint: `Layout: Left-aligned editorial overview page frame.
- Large empty area on left for header text overlay
- Large empty area on left (60% width) for overview text overlay
- Right side (40%) reserved for decorative illustration
- Vertical accent line separating text and illustration areas
- Travel-themed sketches or icons on right side ONLY
- DO NOT draw any text - text will be overlaid`,
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
      { x: 0.03, y: 0.01, width: 0.58, height: 0.10, label: "header" },
      { x: 0.03, y: 0.09, width: 0.58, height: 0.26, label: "overview-text" },
    ],
  },
  {
    id: "bottom-heavy",
    name: "Bottom Heavy",
    nameJa: "下部集約",
    description: "Large illustration at top with text content at bottom",
    promptHint: `Layout: Top illustration, bottom text page frame.
- Large decorative illustration or photo frame in upper 55%
- Large empty area below illustration for header text overlay
- Large empty area at bottom for overview text overlay
- Decorative border or frame around illustration area at top
- All text areas in bottom section must be completely empty
- DO NOT draw any text - text will be overlaid`,
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
      { x: 0.08, y: 0.58, width: 0.84, height: 0.10, label: "header" },
      { x: 0.06, y: 0.66, width: 0.88, height: 0.28, label: "overview-text" },
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
