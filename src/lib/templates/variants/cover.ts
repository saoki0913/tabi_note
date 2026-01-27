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
    promptHint: `Layout: Center-aligned composition.
- Header band with small decorative icon at top
- Main title centered in upper third with generous whitespace
- Cover copy or tagline below title
- Hero illustration or photo frame in center (300-400px tall)
- Pill-shaped chips for dates, destination, members at bottom
- Subtle corner ornaments`,
    weight: 3,
    // No overrides - uses base layout positions
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.08, width: 0.84, height: 0.18, label: "title-area" },
      { x: 0.10, y: 0.62, width: 0.80, height: 0.22, label: "details-area" },
    ],
  },
  {
    id: "left-aligned",
    name: "Left Aligned",
    nameJa: "左寄せ",
    description: "Editorial style with left-aligned text and asymmetric composition",
    promptHint: `Layout: Left-aligned editorial style.
- Thin vertical accent line on left margin
- Title aligned to left with large display font
- Cover copy as left-aligned paragraph
- Asymmetric photo or illustration on right side
- Metadata (dates, members) as left-aligned list
- Minimal decorations, focus on typography`,
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
      { x: 0.05, y: 0.08, width: 0.50, height: 0.18, label: "title-area" },
      { x: 0.05, y: 0.62, width: 0.50, height: 0.22, label: "details-area" },
    ],
  },
  {
    id: "photo-dominant",
    name: "Photo Dominant",
    nameJa: "写真主体",
    description: "Large hero photo with minimal text overlay",
    promptHint: `Layout: Photo-forward design.
- Full or near-full bleed hero photo frame (occupying 60% of page)
- Title overlaid on photo with text shadow or banner
- Minimal text outside photo area
- Small info chips at bottom
- Elegant, cinematic composition`,
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
      { x: 0.08, y: 0.04, width: 0.84, height: 0.14, label: "title-area" },
      { x: 0.10, y: 0.70, width: 0.80, height: 0.18, label: "details-area" },
    ],
  },
  {
    id: "card-stack",
    name: "Card Stack",
    nameJa: "カード重ね",
    description: "Layered cards with depth effect",
    promptHint: `Layout: Stacked card composition.
- Multiple overlapping card shapes with soft shadows
- Title on top card
- Photo frame on middle card (slightly rotated)
- Trip details on bottom cards
- Warm paper texture background
- Washi tape or sticker accents`,
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
      { x: 0.10, y: 0.06, width: 0.80, height: 0.16, label: "title-area" },
      { x: 0.08, y: 0.65, width: 0.84, height: 0.20, label: "details-area" },
    ],
  },
  {
    id: "split",
    name: "Split",
    nameJa: "分割",
    description: "Vertical split with text on one side, image on other",
    promptHint: `Layout: Vertical split composition.
- Page divided into two vertical sections
- Left side: Title, cover copy, and metadata
- Right side: Hero photo or illustration
- Clean dividing line or gradient fade between sections
- Balanced visual weight`,
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
      { x: 0.05, y: 0.08, width: 0.45, height: 0.25, label: "title-area" },
      { x: 0.05, y: 0.55, width: 0.45, height: 0.25, label: "details-area" },
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
