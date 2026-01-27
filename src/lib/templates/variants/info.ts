// Info page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const infoVariants: LayoutVariant[] = [
  {
    id: "card-sections",
    name: "Card Sections",
    nameJa: "カード型",
    description: "Information organized in card-like sections",
    promptHint: `Layout: Card-based information page.
- Header "旅の情報" at top
- Lodging info in card/box area (upper section)
- Cautions/notes in separate card below
- Each card has subtle shadow or border
- Travel-themed icons (bed, warning, etc.) as section markers
- Clean, organized look with clear visual hierarchy`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.10, y: 0.02, width: 0.80, height: 0.08, label: "header" },
      { x: 0.05, y: 0.11, width: 0.90, height: 0.38, label: "lodging-info" },
      { x: 0.05, y: 0.50, width: 0.90, height: 0.26, label: "cautions" },
    ],
  },
  {
    id: "sidebar-notes",
    name: "Sidebar Notes",
    nameJa: "サイドバー",
    description: "Main content with decorative sidebar",
    promptHint: `Layout: Main content with decorative sidebar.
- Narrow decorative sidebar on left (travel stamps, icons)
- Main content area on right (80% width)
- Header "旅の情報" in main area
- Lodging and caution sections stacked
- Sticky note or tag decorations
- Warm, scrapbook-inspired aesthetic`,
    weight: 2,
    zoneOverrides: {
      "header": {
        position: { x: 100, y: 20, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "lodging-info": {
        position: { x: 100, y: 100, anchor: "topLeft" },
        size: { width: 455, height: 300 },
      },
      "cautions": {
        position: { x: 100, y: 420, anchor: "topLeft" },
        size: { width: 455, height: 200 },
      },
    },
    safeZones: [
      { x: 0.15, y: 0.02, width: 0.80, height: 0.08, label: "header" },
      { x: 0.15, y: 0.11, width: 0.80, height: 0.38, label: "lodging-info" },
      { x: 0.15, y: 0.50, width: 0.80, height: 0.26, label: "cautions" },
    ],
  },
];

// Select a variant based on weighted random selection
export function selectInfoVariant(seed?: number): LayoutVariant {
  const totalWeight = infoVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = seed !== undefined
    ? (seed % 100) / 100
    : Math.random();
  let accumulated = 0;

  for (const variant of infoVariants) {
    accumulated += variant.weight / totalWeight;
    if (random <= accumulated) {
      return variant;
    }
  }

  return infoVariants[0];
}

// Get variant by ID
export function getInfoVariant(id: string): LayoutVariant | undefined {
  return infoVariants.find((v) => v.id === id);
}
