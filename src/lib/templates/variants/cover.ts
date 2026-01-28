// Cover page layout variants for shiori generation

import type { LayoutZone } from "@/types/editor";

// Safe zone for text overlay - tells AI where to leave empty space
export interface SafeZone {
  x: number;      // 0-1 normalized coordinate
  y: number;      // 0-1 normalized coordinate
  width: number;  // 0-1 normalized size
  height: number; // 0-1 normalized size
  label?: string; // optional label for the zone (e.g., "title", "details")
}

export interface LayoutVariant {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  promptHint: string;
  weight: number; // Selection probability weight
  // Variant-specific zone position overrides (partial overrides to base PageLayout)
  zoneOverrides?: Partial<Record<string, Partial<LayoutZone>>>;
  // Safe zones for background prompt - areas where AI should leave empty for text
  safeZones?: SafeZone[];
}

export const coverVariants: LayoutVariant[] = [
  {
    id: "centered",
    name: "Centered",
    nameJa: "中央配置",
    description: "Classic centered layout with title at top, hero image in middle",
    promptHint: `Layout: Center-aligned cover page frame.
- Decorative frame and corner ornaments around page edges ONLY
- Large empty rectangular area at top for title text overlay
- Hero illustration or photo frame in center (decorative area)
- Large empty rectangular area at bottom for trip details text overlay
- All decorative elements (stamps, stickers, icons) ONLY on page borders/corners
- DO NOT draw any text - text will be overlaid separately`,
    weight: 3,
    // No overrides - uses base layout positions
    zoneOverrides: {},
    safeZones: [
      { x: 0.06, y: 0.06, width: 0.88, height: 0.20, label: "title-area" },
      { x: 0.08, y: 0.60, width: 0.84, height: 0.26, label: "details-area" },
    ],
  },
  {
    id: "left-aligned",
    name: "Left Aligned",
    nameJa: "左寄せ",
    description: "Editorial style with left-aligned text and asymmetric composition",
    promptHint: `Layout: Left-aligned editorial cover frame.
- Thin vertical accent line on left margin as decoration
- Large empty area on left side for title text overlay
- Asymmetric photo or illustration on right side
- Large empty area at bottom left for metadata text overlay
- All decorative elements on page edges and right side ONLY
- DO NOT draw any text - text will be overlaid separately`,
    weight: 2,
    zoneOverrides: {
      "main-title": {
        position: { x: 40, y: 100, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "cover-copy": {
        position: { x: 40, y: 170, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "destination-pill": {
        position: { x: 40, y: 550, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "date-range": {
        position: { x: 40, y: 600, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "members-list": {
        position: { x: 40, y: 650, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
    },
    safeZones: [
      { x: 0.03, y: 0.06, width: 0.54, height: 0.22, label: "title-area" },
      { x: 0.03, y: 0.60, width: 0.54, height: 0.26, label: "details-area" },
    ],
  },
  {
    id: "photo-dominant",
    name: "Photo Dominant",
    nameJa: "写真主体",
    description: "Large hero photo with minimal text overlay",
    promptHint: `Layout: Photo-forward cover frame.
- Large empty area at top for title text overlay
- Hero photo frame in center (decorative focal area)
- Large empty area at bottom for trip info text overlay
- Elegant, cinematic composition with minimal decorations
- All decorative elements on page borders/corners ONLY
- DO NOT draw any text - text will be overlaid separately`,
    weight: 2,
    zoneOverrides: {
      "main-title": {
        position: { x: "center", y: 60, anchor: "topCenter" },
        size: { width: 500, height: 50 },
        defaultStyle: { fontSize: 36 },
      },
      "cover-copy": {
        position: { x: "center", y: 120, anchor: "topCenter" },
        size: { width: 350, height: 30 },
        defaultStyle: { fontSize: 14 },
      },
      "hero-image": {
        position: { x: "center", y: 180, anchor: "topCenter" },
        size: { width: 520, height: 380 },
      },
    },
    safeZones: [
      { x: 0.06, y: 0.02, width: 0.88, height: 0.18, label: "title-area" },
      { x: 0.08, y: 0.68, width: 0.84, height: 0.22, label: "details-area" },
    ],
  },
  {
    id: "card-stack",
    name: "Card Stack",
    nameJa: "カード重ね",
    description: "Layered cards with depth effect",
    promptHint: `Layout: Stacked card cover frame.
- Multiple overlapping card shapes with soft shadows as frame
- Large empty area on top card for title text overlay
- Photo frame on middle card (decorative, can be slightly rotated)
- Large empty area on bottom cards for trip details text overlay
- Warm paper texture background with washi tape accents on edges
- DO NOT draw any text - text will be overlaid separately`,
    weight: 2,
    zoneOverrides: {
      "main-title": {
        position: { x: "center", y: 80, anchor: "topCenter" },
      },
      "cover-copy": {
        position: { x: "center", y: 150, anchor: "topCenter" },
      },
    },
    safeZones: [
      { x: 0.08, y: 0.04, width: 0.84, height: 0.18, label: "title-area" },
      { x: 0.06, y: 0.63, width: 0.88, height: 0.24, label: "details-area" },
    ],
  },
  {
    id: "split",
    name: "Split",
    nameJa: "分割",
    description: "Vertical split with text on one side, image on other",
    promptHint: `Layout: Vertical split cover frame.
- Page divided into two vertical sections
- Left side: Large empty areas for title and metadata text overlay
- Right side: Hero photo or illustration (decorative area)
- Clean dividing line or gradient fade between sections
- All decorative elements on page borders and right half ONLY
- DO NOT draw any text - text will be overlaid separately`,
    weight: 1,
    zoneOverrides: {
      "main-title": {
        position: { x: 40, y: 100, anchor: "topLeft" },
        size: { width: 260, height: 80 },
        defaultStyle: { alignment: "left", fontSize: 36 },
      },
      "cover-copy": {
        position: { x: 40, y: 190, anchor: "topLeft" },
        size: { width: 250, height: 60 },
        defaultStyle: { alignment: "left", fontSize: 14 },
      },
      "hero-image": {
        position: { x: 320, y: 80, anchor: "topLeft" },
        size: { width: 240, height: 350 },
      },
      "destination-pill": {
        position: { x: 40, y: 500, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "date-range": {
        position: { x: 40, y: 550, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "members-list": {
        position: { x: 40, y: 600, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
    },
    safeZones: [
      { x: 0.03, y: 0.06, width: 0.48, height: 0.28, label: "title-area" },
      { x: 0.03, y: 0.53, width: 0.48, height: 0.30, label: "details-area" },
    ],
  },
];

// Select a variant based on weighted random selection
export function selectCoverVariant(seed?: number): LayoutVariant {
  const totalWeight = coverVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = seed !== undefined
    ? (seed % 100) / 100
    : Math.random();
  let accumulated = 0;

  for (const variant of coverVariants) {
    accumulated += variant.weight / totalWeight;
    if (random <= accumulated) {
      return variant;
    }
  }

  return coverVariants[0];
}

// Get variant by ID
export function getCoverVariant(id: string): LayoutVariant | undefined {
  return coverVariants.find((v) => v.id === id);
}
