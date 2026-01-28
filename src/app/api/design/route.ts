import { NextResponse } from "next/server";
import type {
  DesignMode,
  DesignRenderMode,
  FormatType,
  TemplateType,
  Trip,
  TextLayer,
} from "@/types/trip";
import { selectVariantForMode, getVariantForMode, LayoutVariant } from "@/lib/templates/variants";
import { generateTextLayers } from "@/lib/layers";

const MODEL_ID = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const styleGuides: Record<
  TemplateType,
  {
    mood: string;
    palette: string;
    motifs: string;
    typography: string;
    imagery: string;
    mustInclude: string;
  }
> = {
  minimal: {
    mood: "minimal, clean, airy, editorial, structured, ultra-refined",
    palette:
      "STRICT: Use ONLY ink deep #1a1a2e and paper cream #faf8f5. Maximum 2 colors. No other colors allowed.",
    motifs: "ultra-thin hairlines (0.5pt), generous whitespace (70%+ of page), subtle paper grain texture only",
    typography:
      "Display font: Cormorant Garamond (elegant serif for headings). Body font: Zen Kaku Gothic New (Japanese). Keep text sparse.",
    imagery:
      "Use ONE simple line art illustration OR leave empty. No photos, no patterns, no decorative elements. Embrace negative space.",
    mustInclude:
      "MUST: 70% whitespace minimum. MUST: Only 2 colors (ink + paper). MUST: Hairline rules only (no thick borders). MUST: No decorative icons or stickers.",
  },
  pop: {
    mood: "playful, vibrant, energetic, craft-scrapbook, kawaii-inspired",
    palette:
      "Dominant: pastel pink #ffb6c1, mint #98d8c8, peach #ffcba4. Accent: terracotta #c4654a, gold #c9a227. Background: warm cream #fff5e6.",
    motifs: "round stickers with icons, washi tape strips, confetti dots, star shapes, heart decorations, speech bubbles",
    typography:
      "Display font: rounded bold for headings. Body font: Zen Kaku Gothic New. Use varied sizes for visual rhythm.",
    imagery:
      "Fill page with colorful decorations. Use 5+ different sticker-style icons. Add washi tape at corners. Scatter confetti elements.",
    mustInclude:
      "MUST: At least 5 round sticker decorations. MUST: 2+ washi tape strips. MUST: Confetti/dots scattered on background. MUST: Pastel color scheme (pink, mint, peach).",
  },
  photo: {
    mood: "cinematic, film photography, nostalgic travel memories, serene",
    palette:
      "Film tones: ocean blue #4a7c8f, sage green #7d9471, warm beige #f5f0e8, soft gray #8b8b8b. Apply film grain overlay.",
    motifs: "polaroid-style frames with white borders, film sprocket holes, light leaks, vintage camera icons",
    typography:
      "Display font: Cormorant Garamond (classic serif). Body font: Zen Kaku Gothic New. Caption style for photo labels.",
    imagery:
      "3-4 polaroid/film frames prominently displayed. Add film grain texture overlay to entire page. Include light leak effects in corners.",
    mustInclude:
      "MUST: Film grain texture visible across page. MUST: 2+ polaroid-style frames with thick white borders. MUST: Light leak effect (orange/yellow) in at least one corner. MUST: Muted, desaturated color grading.",
  },
  retro: {
    mood: "1960s-70s vintage, nostalgic travel poster, aged patina, groovy",
    palette:
      "Vintage: burnt orange #cc5500, mustard yellow #e8a435, olive green #6b8e23, aged cream #ede4d4. Sepia undertones throughout.",
    motifs: "halftone dot patterns, vintage postage stamps, retro badges with stars, rounded rectangle frames, dotted borders",
    typography:
      "Display font: bold retro-style headings. Body font: Zen Kaku Gothic New. Numbers in vintage style.",
    imagery:
      "Apply halftone texture to backgrounds. Use 2-3 vintage stamp decorations. Add rounded-corner frames. Include retro sunburst patterns.",
    mustInclude:
      "MUST: Visible halftone dot pattern on at least one section. MUST: 3+ vintage stamp-style decorations (icon only). MUST: Sepia/aged paper tone. MUST: Rounded rectangle borders on text boxes.",
  },
  romantic: {
    mood: "soft, dreamy, elegant, feminine, watercolor-inspired",
    palette:
      "Soft blush #f5e9e4, rose pink #e8b4b8, champagne gold #d4af37, sage mist #d4e5d7, cream white #fffaf0.",
    motifs: "watercolor floral borders, delicate ribbons, gold foil accents, soft gradients, rose illustrations",
    typography:
      "Display font: elegant script or Cormorant Garamond italic. Body font: Zen Kaku Gothic New light weight.",
    imagery:
      "Watercolor floral borders on edges. Soft pink/gold gradient backgrounds. Ribbon decorations. Rose or peony illustrations.",
    mustInclude:
      "MUST: Watercolor-style floral border on at least 2 edges. MUST: Ribbon decoration element. MUST: Pink/gold color dominance. MUST: Soft gradient backgrounds (not flat colors).",
  },
  modern: {
    mood: "sleek, geometric, premium, minimalist-bold, high contrast",
    palette:
      "High contrast: pure black #000000, pure white #ffffff, one accent color (gold #c9a227 OR coral #e07b5a). No gradients.",
    motifs: "geometric shapes (circles, triangles, rectangles), grid lines, bold rules, abstract patterns",
    typography:
      "Display font: bold sans-serif or geometric serif. Body font: Zen Kaku Gothic New. Strong hierarchy with size contrast.",
    imagery:
      "Bold geometric blocks. Asymmetric layouts. One strong accent color against black/white. No organic shapes.",
    mustInclude:
      "MUST: Black and white as primary colors. MUST: Geometric shapes (circles, triangles). MUST: Grid-based layout. MUST: Only ONE accent color. MUST: No organic/floral elements.",
  },
  nature: {
    mood: "organic, botanical, earthy, japanese washi-paper inspired, calm forest",
    palette:
      "Earth tones: forest green #2d5016, warm brown #8b6914, cream #f5f0e8, terracotta #c4654a, sage #7d9471.",
    motifs: "botanical leaf illustrations, washi paper texture, hand-drawn branch lines, small plant icons, natural grain patterns",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. Organic, slightly irregular placement.",
    imagery:
      "Botanical leaf borders. Washi paper texture background. Hand-drawn style plant illustrations. Natural, imperfect edges.",
    mustInclude:
      "MUST: Visible paper/washi texture. MUST: Botanical leaf illustrations (at least 3 different plants). MUST: Earth tone palette (greens, browns). MUST: Hand-drawn style elements.",
  },
  adventure: {
    mood: "explorer, vintage map, expedition journal, bold discovery",
    palette:
      "Explorer: aged parchment #d4c5a9, navy blue #1a3a5c, terracotta #c4654a, forest green #2d4a2d, gold #c9a227.",
    motifs: "old map textures, compass rose, dotted travel routes, vintage postage stamps, expedition badges, coordinate markers",
    typography:
      "Display font: bold expedition-style. Body font: Zen Kaku Gothic New. Numbers styled like coordinates.",
    imagery:
      "Aged map texture as background. Large compass rose decoration. Dotted line route paths. Vintage expedition stamps.",
    mustInclude:
      "MUST: Map/parchment texture background. MUST: Compass rose illustration. MUST: Dotted travel route line. MUST: 2+ vintage expedition stamps (icon only). MUST: Aged/weathered paper effect.",
  },
};

const formatGuides: Record<
  FormatType,
  {
    name: string;
    layout: string;
  }
> = {
  classic: {
    name: "classic",
    layout:
      "Use a clean editorial grid with a header band and 2-3 content cards. Prioritize clarity, balanced spacing, and readable negative space.",
  },
  collage: {
    name: "collage",
    layout:
      "Use overlapping photo frames, washi tape, and scrapbook layers. Keep alignment tidy with clear text zones and avoid text on tape.",
  },
  notebook: {
    name: "notebook",
    layout:
      "Use paper textures, ruled areas, and sticky-note accents (icon-only). Keep a handcrafted journal feel with tidy margins.",
  },
  timeline: {
    name: "timeline",
    layout:
      "Emphasize a vertical timeline with dotted guides and step markers. Use a left rail and align text to the right.",
  },
};

const modeGuides: Record<
  DesignMode,
  {
    purpose: string;
    layout: string;
  }
> = {
  cover: {
    purpose: "travel booklet cover",
    layout:
      "Structure: a thin header band at top with a small icon/ornament (no extra text), a centered title block, optional cover copy under the title, then 2-3 pill chips for dates/destination/members. Add subtle travel ornaments in corners and a hero illustration or photo frame. Keep all text inside dedicated text boxes.",
  },
  overview: {
    purpose: "overview/plan page",
    layout:
      "Structure: header band with icon, then two main cards (overview, transport/lodging). Use soft dividers and paper-card blocks. Include one calm photo/illustration area without text.",
  },
  schedule: {
    purpose: "daily schedule page",
    layout:
      "Structure: header band, highlight summary block, then a vertical numbered list/timeline. Optional small photo frames on the side with no captions unless provided. Keep list left-aligned with generous line spacing.",
  },
  checklist: {
    purpose: "packing checklist page",
    layout:
      "Structure: header band, two columns of checkbox rows (packing/wish), each row with a square checkbox and dotted guide. Keep headings simple.",
  },
  info: {
    purpose: "information page",
    layout:
      "Structure: header band, two bordered info blocks (lodging/notes). Keep margins wide and use subtle dashed borders. Avoid extra labels.",
  },
  memo: {
    purpose: "free memo page",
    layout:
      "Structure: header band, then a large lined or dotted paper area for notes, minimal ornaments.",
  },
};

const sanitize = (value: string, limit = 120): string => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit)}…`;
};

const normalizeText = (value: string): string =>
  value.replace(/\r\n/g, "\n").trim();

const formatList = (
  items: string[],
  limit = 0,
  separator = ", ",
) => {
  const filtered = items.filter(Boolean);
  const trimmed = limit > 0 ? filtered.slice(0, limit) : filtered;
  return trimmed.map((item) => sanitize(item, 60)).join(separator);
};

const joinList = (items: string[], separator = "・") =>
  items
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join(separator);

/**
 * Generate SAFE_ZONES instruction for the background prompt
 * This tells the AI where to leave empty space for text overlay
 * CRITICAL: This instruction must be strong and placed early in the prompt
 */
const buildSafeZonesInstruction = (variant?: LayoutVariant | null): string => {
  if (!variant?.safeZones?.length) return "";

  const zones = variant.safeZones.map((z, i) => {
    const label = z.label ? ` (${z.label})` : "";
    return `Zone ${i + 1}${label}: x=${Math.round(z.x * 100)}%, y=${Math.round(z.y * 100)}%, w=${Math.round(z.width * 100)}%, h=${Math.round(z.height * 100)}%`;
  }).join("; ");

  return `**MANDATORY SAFE ZONES** - These areas MUST be completely empty with NO decorations whatsoever. Fill them ONLY with a plain, solid, light-colored background (white, cream, or very pale color matching the page theme). ABSOLUTELY NO illustrations, NO patterns, NO lines, NO borders, NO decorative elements inside these zones: ${zones}. All decorative elements (leaves, stamps, stickers, borders, etc.) must be placed OUTSIDE these safe zones, only around the page edges.`;
};

const buildBackgroundPrompt = (
  trip: Trip,
  mode: DesignMode,
  variant?: LayoutVariant | null,
) => {
  const guide = styleGuides[trip.templateType];
  const formatGuide = formatGuides[trip.formatType ?? "classic"];
  const modeGuide = modeGuides[mode];
  const destination = sanitize(trip.destination || "Unknown destination", 80);
  const title = sanitize(trip.title || "Travel booklet");
  const dates = trip.startDate && trip.endDate ? `${trip.startDate} to ${trip.endDate}` : "Dates TBD";
  const members = formatList(
    trip.members.map((member) => member.name),
    6,
    "・",
  );
  const wants = formatList(trip.wantItems.map((item) => item.text), 5);
  const highlights = formatList(
    trip.dayPlans.flatMap((plan) => plan.activities.slice(0, 2)),
    6,
  );

  const sharedDetails = [
    `Visual cues (do not write these words): destination ${destination}, trip title ${title}.`,
    members ? `Group size: ${trip.members.length}.` : "",
    wants ? `Interests: ${wants}.` : "",
    highlights ? `Highlights: ${highlights}.` : "",
    `Travel dates: ${dates}.`,
  ]
    .filter(Boolean)
    .join(" ");

  // Use variant's promptHint if available, otherwise use default modeGuide.layout
  const layoutHint = variant?.promptHint || modeGuide.layout;

  // Build SAFE_ZONES instruction from variant
  const safeZonesInstruction = buildSafeZonesInstruction(variant);

  return [
    `You are a visual designer creating a BACKGROUND-ONLY image for a printable ${modeGuide.purpose}.`,
    "Create a single full-bleed A4 portrait image (aspect ratio 210:297, portrait orientation) with a clean, print-ready look.",
    // SAFE ZONES instruction - placed early for priority
    safeZonesInstruction,
    // Style directions come after safe zones
    `Style direction: ${guide.mood}. Palette: ${guide.palette}. Motifs: ${guide.motifs}.`,
    guide.imagery,
    `REQUIRED VISUAL ELEMENTS (place ONLY on page edges/borders, OUTSIDE safe zones): ${guide.mustInclude}`,
    `Format direction (${formatGuide.name}): ${formatGuide.layout}`,
    "This page is part of a multi-page booklet; keep a consistent design system across pages.",
    "Use collage elements, paper textures, and icon-only stickers. Avoid any sticker text. All decorative elements must stay on page borders/edges.",
    layoutHint,
    // Stronger text prohibition
    "CRITICAL: This is a BACKGROUND ONLY image. Do NOT include any words, letters, numbers, logos, UI labels, titles, dates, names, or readable text of any kind anywhere in the image.",
    "Avoid letter-like shapes in stamps, tickets, maps, badges, and signage.",
    "REMINDER: Safe zones MUST remain completely empty with plain, solid backgrounds - NO decorations inside them.",
    sharedDetails,
  ].filter(Boolean).join(" ");
};

const buildFullPrompt = (
  trip: Trip,
  mode: DesignMode,
  options: {
    pageNumber?: number;
    totalPages?: number;
    day?: number;
    variant?: LayoutVariant | null;
  },
) => {
  const guide = styleGuides[trip.templateType];
  const formatGuide = formatGuides[trip.formatType ?? "classic"];
  const modeGuide = modeGuides[mode];
  const pageNumber = options.pageNumber ?? 1;
  const totalPages = options.totalPages ?? 1;
  const destination = trip.destination ? normalizeText(trip.destination) : "";
  const title = trip.title ? normalizeText(trip.title) : "";
  const dates =
    trip.startDate && trip.endDate
      ? `${trip.startDate} 〜 ${trip.endDate}`
      : "";
  const members = joinList(trip.members.map((member) => member.name));
  const coverCopy = trip.aiContent?.coverCopy
    ? normalizeText(trip.aiContent.coverCopy)
    : "";
  const overviewText = trip.aiContent?.overviewText
    ? normalizeText(trip.aiContent.overviewText)
    : "";
  const cautionsText = trip.aiContent?.cautionsText
    ? trip.aiContent.cautionsText
    : "";
  const packingList = trip.aiContent?.packingSuggestions ?? [];
  const wantList = trip.wantItems.map((item) => item.text);
  const plan =
    mode === "schedule"
      ? trip.dayPlans.find((entry) => entry.day === options.day) ??
        trip.dayPlans[0]
      : undefined;
  const planTitle = plan ? `${plan.day}日目` : "日程";
  const planDate = plan?.date ? `(${plan.date})` : "";
  const planSummary = plan ? trip.aiContent?.daySummaries[plan.day] : "";
  const activities = plan?.activities ?? [];
  const lodgingList = trip.lodgings;

  const textLines: string[] = [];

  if (mode === "cover") {
    if (title) textLines.push(title);
    if (coverCopy) textLines.push(coverCopy);
    if (destination) textLines.push(`目的地：${destination}`);
    if (dates) textLines.push(`日程：${dates}`);
    if (members) textLines.push(`メンバー：${members}`);
  }

  if (mode === "overview") {
    textLines.push("旅のプラン");
    if (overviewText) textLines.push(`概要：${overviewText}`);
    if (trip.transportText) {
      textLines.push(`移動：${normalizeText(trip.transportText)}`);
    }
    if (lodgingList.length > 0) {
      textLines.push("宿泊先:");
      lodgingList.forEach((lodging) => {
        textLines.push(
          `・${normalizeText(lodging.name)}${
            lodging.address ? ` / ${normalizeText(lodging.address)}` : ""
          }${
            lodging.checkin || lodging.checkout
              ? ` / IN ${lodging.checkin || "-"} / OUT ${lodging.checkout || "-"}`
              : ""
          }`,
        );
      });
    }
  }

  if (mode === "schedule") {
    textLines.push(`${planTitle} ${planDate}`.trim());
    if (planSummary) {
      textLines.push(`見どころ：${normalizeText(planSummary)}`);
    }
    if (activities.length > 0) {
      activities.forEach((activity, index) => {
        textLines.push(`${index + 1}. ${normalizeText(activity)}`);
      });
    }
  }

  if (mode === "checklist") {
    textLines.push("持ち物リスト");
    if (packingList.length > 0) {
      textLines.push("持ち物:");
      packingList.forEach((item) => {
        textLines.push(`□ ${normalizeText(item)}`);
      });
    }
    if (wantList.length > 0) {
      textLines.push("やりたいこと:");
      wantList.forEach((item) => {
        textLines.push(`□ ${normalizeText(item)}`);
      });
    }
  }

  if (mode === "info") {
    textLines.push("インフォメーション");
    if (lodgingList.length > 0) {
      textLines.push("宿泊先:");
      lodgingList.forEach((lodging) => {
        textLines.push(
          `・${normalizeText(lodging.name)}${
            lodging.address ? ` / ${normalizeText(lodging.address)}` : ""
          }${
            lodging.checkin || lodging.checkout
              ? ` / IN ${lodging.checkin || "-"} / OUT ${lodging.checkout || "-"}`
              : ""
          }`,
        );
      });
    }
    if (cautionsText) {
      textLines.push("注意事項:");
      cautionsText.split("\n").forEach((line) => {
        if (line.trim()) {
          textLines.push(`・${normalizeText(line)}`);
        }
      });
    }
    if (trip.notes) {
      textLines.push("メモ:");
      trip.notes.split("\n").forEach((line) => {
        if (line.trim()) {
          textLines.push(`・${normalizeText(line)}`);
        }
      });
    }
  }

  if (mode === "memo") {
    textLines.push("メモ");
    textLines.push("自由記入スペース");
  }

  const pageLabel = `${pageNumber}/${totalPages}`;
  textLines.push(pageLabel);

  const textBlock = JSON.stringify(textLines, null, 2);
  const modeHints: string[] = [];

  if (mode === "schedule") {
    modeHints.push(
      "Render the numbered lines as a vertical timeline or list in the given order. Do not invent times.",
    );
  }

  if (mode === "checklist") {
    modeHints.push(
      "Render lines starting with □ as checkboxes. Do not add extra items.",
    );
  }

  return [
    `You are a visual designer creating a printable ${modeGuide.purpose}.`,
    "Output a single full-bleed A4 portrait page (aspect ratio 210:297, ideally 2480x3508px at 300dpi).",
    "STRICT RULES:",
    "1) This is a copy task: render EVERY line exactly as provided, preserving all characters and punctuation.",
    "2) Do not add, translate, rephrase, or remove any characters. Do not invent labels.",
    "3) Use only characters that appear in TEXT_LINES_JSON. Do not add Latin letters unless they are in the lines.",
    "4) Do not place any text on stickers, illustrations, maps, stamps, or tickets. Use icon-only motifs.",
    "5) If text is long, reduce font size, tighten spacing, or use multi-column layout. Do not omit any lines.",
    "6) Keep punctuation, small Japanese characters, and digits intact. Do not switch languages.",
    "7) Absolutely no decorative words like TRAVEL, DESTINATION, DATES, MEMBERS, ALOHA, VACATION, SURF, STEP.",
    "Use a clear hierarchy: title > subtitle > body > lists.",
    "Keep text within a 12-15mm safe margin (about 140px). Avoid clipping or overlaps.",
    "Ensure text is crisp and high-contrast against the background for print readability.",
    "The last text line is the page number; place it at the bottom center as a small label.",
    `Style direction: ${guide.mood}. Palette: ${guide.palette}. Motifs: ${guide.motifs}.`,
    guide.typography,
    guide.imagery,
    `REQUIRED VISUAL ELEMENTS (must appear in final design): ${guide.mustInclude}`,
    `Format direction (${formatGuide.name}): ${formatGuide.layout}`,
    "This page is part of a multi-page booklet; keep a consistent design system across pages.",
    "Use warm paper textures, subtle grain, and soft shadows for depth. Avoid harsh neon colors.",
    "Layout guidance:",
    modeGuide.layout,
    // Add variant-specific layout hint if available
    ...(options.variant ? [`Layout variant (${options.variant.name}):\n${options.variant.promptHint}`] : []),
    ...modeHints,
    "TEXT_LINES_JSON (render only the strings, in order; do not render brackets/quotes/commas):",
    textBlock,
  ].join("\n");
};


export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    trip?: Trip;
    mode?: DesignMode | "page" | string;
    renderMode?: DesignRenderMode | string;
    pageNumber?: number;
    totalPages?: number;
    day?: number;
    variantId?: string;
    randomVariant?: boolean;
  };

  if (!body.trip) {
    return NextResponse.json({ error: "Trip payload is required." }, { status: 400 });
  }

  const rawMode = body.mode ?? "cover";
  const normalizedMode =
    rawMode === "page" ? "overview" : String(rawMode || "cover");
  const mode: DesignMode =
    normalizedMode in modeGuides ? (normalizedMode as DesignMode) : "cover";

  // Determine render mode: "background", "full", or "layered"
  let renderMode: DesignRenderMode;
  if (body.renderMode === "background") {
    renderMode = "background";
  } else if (body.renderMode === "layered") {
    renderMode = "layered";
  } else {
    renderMode = "full";
  }

  // Get layout variant for all pages (used for both full and layered modes)
  let variant: LayoutVariant | null = null;
  if (body.variantId) {
    // Use specific variant if provided
    variant = getVariantForMode(mode, body.variantId) ?? null;
  } else if (body.randomVariant !== false) {
    // Use random weighted selection (default behavior)
    // Use trip ID + mode as seed for consistency per page
    const baseSeed = body.trip.id
      ? body.trip.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
      : 0;
    const modeSeed = mode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const seed = baseSeed + modeSeed + (body.day ?? 0);
    variant = selectVariantForMode(mode, seed);
  }

  // For layered mode, generate background (no text) + text layers separately
  // For background mode, generate background only
  // For full mode, generate complete image with text
  const prompt =
    renderMode === "layered" || renderMode === "background"
      ? buildBackgroundPrompt(body.trip, mode, variant)
      : buildFullPrompt(body.trip, mode, {
          pageNumber: body.pageNumber,
          totalPages: body.totalPages,
          day: body.day,
          variant,
        });

  // Temperature: 0.35 for full mode (balance text accuracy with visual creativity)
  // 0.3 for background/layered mode (more predictable backgrounds, better safe zone compliance)
  const temperature = renderMode === "full" ? 0.35 : 0.3;

  // Generate text layers for layered mode (before API call to return early if only layers needed)
  // Pass the variant to apply zone position overrides
  let textLayers: TextLayer[] | undefined;
  if (renderMode === "layered") {
    textLayers = generateTextLayers(body.trip, mode, body.day, variant);
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        responseModalities: ["IMAGE"],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "Gemini request failed.", detail: errorText },
      { status: response.status },
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { mimeType?: string; data?: string };
          inline_data?: { mime_type?: string; data?: string };
        }>;
      };
    }>;
  };

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart =
    parts.find((part) => part.inlineData?.data) ??
    parts.find((part) => part.inline_data?.data);

  if (!imagePart) {
    return NextResponse.json(
      { error: "No image data returned from Gemini." },
      { status: 502 },
    );
  }

  const inlineData = imagePart.inlineData ?? imagePart.inline_data;
  const base64 = inlineData?.data ?? "";
  const mimeType =
    inlineData && "mimeType" in inlineData
      ? inlineData.mimeType ?? "image/png"
      : inlineData && "mime_type" in inlineData
        ? inlineData.mime_type ?? "image/png"
        : "image/png";

  if (!base64) {
    return NextResponse.json(
      { error: "Gemini returned an empty image payload." },
      { status: 502 },
    );
  }

  // Build response based on render mode
  if (renderMode === "layered") {
    // Layered mode: return background image + text layers
    return NextResponse.json({
      base64,
      mimeType,
      prompt,
      mode,
      renderType: "layered" as const,
      textLayers,
      variantId: variant?.id,
      variantName: variant?.name,
    });
  }

  // Background or Full mode: return image only
  return NextResponse.json({
    base64,
    mimeType,
    prompt,
    mode,
    renderType: renderMode === "background" ? "legacy" : "legacy" as const,
    variantId: variant?.id,
    variantName: variant?.name,
  });
}
