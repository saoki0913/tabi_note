// Memo page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const memoVariants: LayoutVariant[] = [
  {
    id: "lined",
    name: "Lined",
    nameJa: "罫線",
    description: "Classic lined notebook page style",
    promptHint: `Layout: Lined notebook memo page.
- Header "メモ" at top with decorative underline
- Large memo area with subtle horizontal lines
- Margin area on left for decorations
- Corner decorations (tape, clips, stamps)
- Notebook paper texture background
- Clean, minimalist writing space`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.10, y: 0.02, width: 0.80, height: 0.08, label: "header" },
      { x: 0.05, y: 0.11, width: 0.90, height: 0.82, label: "memo-area" },
    ],
  },
  {
    id: "decorated",
    name: "Decorated",
    nameJa: "装飾付き",
    description: "Memo page with travel-themed decorations",
    promptHint: `Layout: Decorated memo page.
- Header "メモ" with travel icon
- Memo area surrounded by decorative border
- Travel-themed illustrations in corners (compass, plane, map)
- Subtle grid or dot pattern in writing area
- Scrapbook sticker aesthetic
- Space for creativity while maintaining functionality`,
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
      { x: 0.12, y: 0.03, width: 0.76, height: 0.08, label: "header" },
      { x: 0.08, y: 0.12, width: 0.84, height: 0.80, label: "memo-area" },
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
