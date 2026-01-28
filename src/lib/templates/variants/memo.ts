// Memo page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const memoVariants: LayoutVariant[] = [
  {
    id: "lined",
    name: "Lined",
    nameJa: "罫線",
    description: "Classic lined notebook page style",
    promptHint: `Layout: Lined notebook memo page frame.
- Large empty area at top for header text overlay
- Large empty memo area (can have very subtle horizontal lines as texture ONLY)
- Corner decorations (tape, clips, stamps) on page edges/corners ONLY
- Notebook paper texture background
- All decorative elements on page borders and margins ONLY
- DO NOT draw any text - text will be overlaid`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.01, width: 0.84, height: 0.10, label: "header" },
      { x: 0.03, y: 0.09, width: 0.94, height: 0.86, label: "memo-area" },
    ],
  },
  {
    id: "decorated",
    name: "Decorated",
    nameJa: "装飾付き",
    description: "Memo page with travel-themed decorations",
    promptHint: `Layout: Decorated memo page frame.
- Large empty area at top for header text overlay
- Large empty memo area for writing text overlay
- Decorative border around page edges ONLY
- Travel-themed illustrations (compass, plane, map) in corners ONLY
- Subtle grid or dot pattern as background texture (very faint)
- DO NOT draw any text - text will be overlaid`,
    weight: 2,
    zoneOverrides: {
      "header": {
        position: { x: "center", y: 30, anchor: "topCenter" },
      },
      "memo-area": {
        position: { x: 50, y: 110, anchor: "topLeft" },
        size: { width: 495, height: 660 },
      },
    },
    safeZones: [
      { x: 0.10, y: 0.02, width: 0.80, height: 0.10, label: "header" },
      { x: 0.06, y: 0.10, width: 0.88, height: 0.84, label: "memo-area" },
    ],
  },
];

// Select a variant based on weighted random selection
export function selectMemoVariant(seed?: number): LayoutVariant {
  const totalWeight = memoVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = seed !== undefined
    ? (seed % 100) / 100
    : Math.random();
  let accumulated = 0;

  for (const variant of memoVariants) {
    accumulated += variant.weight / totalWeight;
    if (random <= accumulated) {
      return variant;
    }
  }

  return memoVariants[0];
}

// Get variant by ID
export function getMemoVariant(id: string): LayoutVariant | undefined {
  return memoVariants.find((v) => v.id === id);
}
