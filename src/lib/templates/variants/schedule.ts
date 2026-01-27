// Schedule page layout variants for shiori generation

import { LayoutVariant } from "./cover";

export const scheduleVariants: LayoutVariant[] = [
  {
    id: "timeline-left",
    name: "Timeline Left",
    nameJa: "タイムライン左",
    description: "Vertical timeline on left with content on right",
    promptHint: `Layout: Left-rail timeline.
- Thin vertical timeline line on left margin
- Numbered or dotted step markers along timeline
- Activity text aligned to right of timeline
- Day header at top with date
- Summary/highlight block below header
- Optional small photo frames on far right`,
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
      { x: 0.05, y: 0.02, width: 0.90, height: 0.10, label: "header" },
      { x: 0.08, y: 0.13, width: 0.85, height: 0.75, label: "activities" },
    ],
  },
  {
    id: "timeline-center",
    name: "Timeline Center",
    nameJa: "タイムライン中央",
    description: "Centered timeline with alternating left-right content",
    promptHint: `Layout: Centered timeline with alternating sides.
- Vertical timeline in center of page
- Activities alternate between left and right of timeline
- Numbered circles as markers
- Day header centered at top
- Symmetrical, balanced composition`,
    weight: 2,
    zoneOverrides: {},
    safeZones: [
      { x: 0.10, y: 0.02, width: 0.80, height: 0.10, label: "header" },
      { x: 0.05, y: 0.13, width: 0.40, height: 0.75, label: "left-activities" },
      { x: 0.55, y: 0.13, width: 0.40, height: 0.75, label: "right-activities" },
    ],
  },
  {
    id: "list-cards",
    name: "List Cards",
    nameJa: "リストカード",
    description: "Activities as individual cards in a vertical list",
    promptHint: `Layout: Card-based activity list.
- Day header with decorative banner
- Each activity in its own card with subtle shadow
- Cards stacked vertically with small gaps
- Numbered badges on cards
- Clean, modern look with rounded corners`,
    weight: 2,
    zoneOverrides: {},
    safeZones: [
      { x: 0.08, y: 0.02, width: 0.84, height: 0.10, label: "header" },
      { x: 0.06, y: 0.13, width: 0.88, height: 0.75, label: "activities" },
    ],
  },
  {
    id: "journal",
    name: "Journal",
    nameJa: "ジャーナル",
    description: "Handwritten journal style with notes area",
    promptHint: `Layout: Journal/diary style.
- Lined or dotted paper background
- Day header as handwritten-style text
- Activities as bullet points with checkbox style
- Margin area for small photo frames
- Sticky note accent for highlights
- Warm, crafted feel`,
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
      { x: 0.06, y: 0.02, width: 0.70, height: 0.10, label: "header" },
      { x: 0.06, y: 0.12, width: 0.70, height: 0.78, label: "activities" },
    ],
  },
  {
    id: "grid",
    name: "Grid",
    nameJa: "グリッド",
    description: "Grid layout with activities in cells",
    promptHint: `Layout: Grid-based schedule.
- Day header spanning full width
- 2-3 column grid for activities
- Each cell with number and activity text
- Photo frames integrated into grid
- Clean lines, structured appearance`,
    weight: 1,
    zoneOverrides: {},
    safeZones: [
      { x: 0.05, y: 0.02, width: 0.90, height: 0.10, label: "header" },
      { x: 0.05, y: 0.13, width: 0.90, height: 0.75, label: "grid-area" },
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
