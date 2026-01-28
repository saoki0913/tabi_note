// Info page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const infoVariants: LayoutVariant[] = [
  {
    id: "card-sections",
    name: "Card Sections",
    nameJa: "カード型",
    description: "Information organized in card-like sections",
    promptHint: `Layout: Card-based information page frame.
- Large empty area at top for header text overlay
- Large empty rectangular area for lodging info text overlay
- Large empty rectangular area below for cautions text overlay
- Card shapes with subtle shadows as background frame elements ONLY
- Travel-themed icons on page edges/corners ONLY
- DO NOT draw any text or icons inside content areas - text will be overlaid`,
    weight: 3,
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.01, width: 0.84, height: 0.10, label: "header" },
      { x: 0.03, y: 0.09, width: 0.94, height: 0.42, label: "lodging-info" },
      { x: 0.03, y: 0.48, width: 0.94, height: 0.30, label: "cautions" },
    ],
  },
  {
    id: "sidebar-notes",
    name: "Sidebar Notes",
    nameJa: "サイドバー",
    description: "Main content with decorative sidebar",
    promptHint: `Layout: Sidebar-style information page frame.
- Narrow decorative sidebar on left (travel stamps, icons) - decorations here ONLY
- Large empty main content area on right (80% width) for text overlay
- Large empty area for header text overlay
- Large empty areas for lodging and caution text overlays
- All decorative elements on left sidebar and page borders ONLY
- DO NOT draw any text - text will be overlaid`,
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
      { x: 0.13, y: 0.01, width: 0.84, height: 0.10, label: "header" },
      { x: 0.13, y: 0.09, width: 0.84, height: 0.42, label: "lodging-info" },
      { x: 0.13, y: 0.48, width: 0.84, height: 0.30, label: "cautions" },
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
