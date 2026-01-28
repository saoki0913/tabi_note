// Checklist page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const checklistVariants: LayoutVariant[] = [
  {
    id: "two-column",
    name: "Two Column",
    nameJa: "2列",
    description: "Classic two-column layout for packing and want lists",
    promptHint: `Layout: Two-column checklist page frame.
- Decorative frame around the page edges ONLY
- All decorative elements (leaves, stamps, stickers, icons) ONLY on page borders/corners
- Two large empty rectangular areas for text overlay (left and right columns)
- Top area empty for header text
- Warm paper or notebook texture as background fill
- DO NOT draw any checkboxes, lines, bullets, or dividers - text will be overlaid`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.01, width: 0.84, height: 0.10, label: "header" },
      { x: 0.03, y: 0.09, width: 0.46, height: 0.55, label: "packing-list" },
      { x: 0.50, y: 0.09, width: 0.46, height: 0.55, label: "want-list" },
    ],
  },
  {
    id: "stacked",
    name: "Stacked",
    nameJa: "縦並び",
    description: "Vertically stacked lists with decorative elements",
    promptHint: `Layout: Vertical stacked checklist page frame.
- Decorative border/frame around page edges ONLY
- All decorative elements (travel icons, stamps, stickers) ONLY on page borders/corners
- Two large empty rectangular areas stacked vertically for text overlay
- Top area empty for header text
- Notebook or journal page texture as background
- DO NOT draw any checkboxes, lines, bullets, or dividers - text will be overlaid`,
    weight: 2,
    zoneOverrides: {
      "packing-list": {
        position: { x: 40, y: 100, anchor: "topLeft" },
        size: { width: 515, height: 280 },
      },
      "want-list": {
        position: { x: 40, y: 420, anchor: "topLeft" },
        size: { width: 515, height: 280 },
      },
    },
    safeZones: [
      { x: 0.08, y: 0.01, width: 0.84, height: 0.10, label: "header" },
      { x: 0.03, y: 0.09, width: 0.92, height: 0.38, label: "packing-list" },
      { x: 0.03, y: 0.46, width: 0.92, height: 0.42, label: "want-list" },
    ],
  },
];

// Select a variant based on weighted random selection
export function selectChecklistVariant(seed?: number): LayoutVariant {
  const totalWeight = checklistVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = seed !== undefined
    ? (seed % 100) / 100
    : Math.random();
  let accumulated = 0;

  for (const variant of checklistVariants) {
    accumulated += variant.weight / totalWeight;
    if (random <= accumulated) {
      return variant;
    }
  }

  return checklistVariants[0];
}

// Get variant by ID
export function getChecklistVariant(id: string): LayoutVariant | undefined {
  return checklistVariants.find((v) => v.id === id);
}
