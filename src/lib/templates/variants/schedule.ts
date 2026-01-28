// Schedule page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const scheduleVariants: LayoutVariant[] = [
  {
    id: "timeline-left",
    name: "Timeline Left",
    nameJa: "タイムライン左",
    description: "Vertical timeline on left with content on right",
    promptHint: `Layout: Left-rail timeline page frame.
- Thin vertical decorative timeline line on left margin ONLY
- Large empty rectangular area at top for day header text overlay
- Large empty rectangular area on right for activities text overlay
- All decorative elements (markers, photo frames) on page edges/corners ONLY
- DO NOT draw any text, numbers, or bullet points - text will be overlaid`,
    weight: 3,
    zoneOverrides: {
      "day-header": {
        position: { x: 40, y: 20, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "activities-list": {
        position: { x: 60, y: 120, anchor: "topLeft" },
        size: { width: 480, height: 600 },
      },
    },
    safeZones: [
      { x: 0.03, y: 0.01, width: 0.94, height: 0.12, label: "header" },
      { x: 0.06, y: 0.11, width: 0.90, height: 0.80, label: "activities" },
    ],
  },
  {
    id: "timeline-center",
    name: "Timeline Center",
    nameJa: "タイムライン中央",
    description: "Centered timeline with alternating left-right content",
    promptHint: `Layout: Centered timeline page frame.
- Thin vertical decorative line in center of page as frame element
- Large empty rectangular area at top for day header text overlay
- Large empty areas on left and right of timeline for activities text overlay
- All decorative elements (circles, markers) on page borders/corners ONLY
- DO NOT draw any text or numbers - text will be overlaid`,
    weight: 2,
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.01, width: 0.84, height: 0.12, label: "header" },
      { x: 0.03, y: 0.11, width: 0.44, height: 0.80, label: "left-activities" },
      { x: 0.53, y: 0.11, width: 0.44, height: 0.80, label: "right-activities" },
    ],
  },
  {
    id: "list-cards",
    name: "List Cards",
    nameJa: "リストカード",
    description: "Activities as individual cards in a vertical list",
    promptHint: `Layout: Card-based schedule page frame.
- Decorative banner frame at top for day header text overlay
- Large empty rectangular area for activities text overlay
- Card shapes and shadows as subtle background frame elements ONLY
- All decorative elements (badges, icons) on page edges/corners ONLY
- DO NOT draw any text or numbers - text will be overlaid`,
    weight: 2,
    zoneOverrides: {},
    safeZones: [
      { x: 0.06, y: 0.01, width: 0.88, height: 0.12, label: "header" },
      { x: 0.04, y: 0.11, width: 0.92, height: 0.80, label: "activities" },
    ],
  },
  {
    id: "journal",
    name: "Journal",
    nameJa: "ジャーナル",
    description: "Handwritten journal style with notes area",
    promptHint: `Layout: Journal/diary style page frame.
- Paper texture background (can have subtle grid/dots)
- Large empty area at top for day header text overlay
- Large empty area for activities text overlay
- Decorative elements (sticky notes, photo frames) on right margin/edges ONLY
- DO NOT draw any text, checkboxes, or bullet points - text will be overlaid`,
    weight: 2,
    zoneOverrides: {
      "day-header": {
        position: { x: 50, y: 30, anchor: "topLeft" },
        defaultStyle: { alignment: "left" },
      },
      "activities-list": {
        position: { x: 50, y: 110, anchor: "topLeft" },
        size: { width: 400, height: 600 },
      },
    },
    safeZones: [
      { x: 0.04, y: 0.01, width: 0.74, height: 0.12, label: "header" },
      { x: 0.04, y: 0.10, width: 0.74, height: 0.82, label: "activities" },
    ],
  },
  {
    id: "grid",
    name: "Grid",
    nameJa: "グリッド",
    description: "Grid layout with activities in cells",
    promptHint: `Layout: Grid-based schedule page frame.
- Large empty area at top for day header text overlay
- Large empty grid area for activities text overlay
- Grid lines as subtle background frame elements ONLY
- Photo frames on page edges/corners ONLY
- DO NOT draw any text or numbers - text will be overlaid`,
    weight: 1,
    zoneOverrides: {},
    safeZones: [
      { x: 0.03, y: 0.01, width: 0.94, height: 0.12, label: "header" },
      { x: 0.03, y: 0.11, width: 0.94, height: 0.80, label: "grid-area" },
    ],
  },
];

// Select a variant based on weighted random selection
export function selectScheduleVariant(seed?: number): LayoutVariant {
  const totalWeight = scheduleVariants.reduce((sum, v) => sum + v.weight, 0);
  const random = seed !== undefined
    ? (seed % 100) / 100
    : Math.random();
  let accumulated = 0;

  for (const variant of scheduleVariants) {
    accumulated += variant.weight / totalWeight;
    if (random <= accumulated) {
      return variant;
    }
  }

  return scheduleVariants[0];
}

// Get variant by ID
export function getScheduleVariant(id: string): LayoutVariant | undefined {
  return scheduleVariants.find((v) => v.id === id);
}
