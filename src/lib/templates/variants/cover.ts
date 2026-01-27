// Cover page layout variants for shiori generation

export interface LayoutVariant {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  promptHint: string;
  weight: number; // Selection probability weight
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
