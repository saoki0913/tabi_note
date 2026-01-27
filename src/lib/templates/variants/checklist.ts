// Checklist page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const checklistVariants: LayoutVariant[] = [
  {
    id: "two-column",
    name: "Two Column",
    nameJa: "2列",
    description: "Classic two-column layout for packing and want lists",
    promptHint: `Layout: Two-column checklist design.
- Header banner with "持ち物チェック" at top
- Two equal columns below header
- Left column: Packing list area with checkbox-style lines
- Right column: "やりたいこと" list area
- Subtle column divider (dotted line or decorative element)
- Checkbox or bullet decorations for list items
- Warm paper or notebook texture background`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.10, y: 0.02, width: 0.80, height: 0.08, label: "header" },
      { x: 0.05, y: 0.11, width: 0.43, height: 0.52, label: "packing-list" },
      { x: 0.52, y: 0.11, width: 0.43, height: 0.52, label: "want-list" },
    ],
  },
  {
    id: "stacked",
    name: "Stacked",
    nameJa: "縦並び",
    description: "Vertically stacked lists with decorative elements",
    promptHint: `Layout: Vertical stacked checklist.
- Header "持ち物チェック" at top
- Packing list in upper section (full width)
- Decorative divider (washi tape, ribbon, or ornament)
- "やりたいこと" list in lower section
- Side decorations (travel icons, stamps, stickers)
- Notebook or journal page aesthetic`,
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
      { x: 0.10, y: 0.02, width: 0.80, height: 0.08, label: "header" },
      { x: 0.05, y: 0.11, width: 0.88, height: 0.35, label: "packing-list" },
      { x: 0.05, y: 0.48, width: 0.88, height: 0.38, label: "want-list" },
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
