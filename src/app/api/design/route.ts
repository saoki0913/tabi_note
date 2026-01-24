import { NextResponse } from "next/server";
import type {
  DesignMode,
  FormatType,
  TemplateType,
  Trip,
} from "@/types/trip";

const MODEL_ID = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const styleGuides: Record<
  TemplateType,
  {
    mood: string;
    palette: string;
    motifs: string;
  }
> = {
  minimal: {
    mood: "minimal, clean, airy, editorial, structured",
    palette: "neutral whites, warm grays, soft beige, subtle charcoal",
    motifs: "thin lines, gentle grids, generous whitespace, fine borders",
  },
  pop: {
    mood: "playful, vibrant, energetic, friendly, craft-inspired",
    palette: "bright pinks, warm oranges, sunny yellows, bold coral accents",
    motifs: "stickers, doodles, confetti accents, rounded cards, washi tape",
  },
  photo: {
    mood: "photo-forward, cinematic, cozy travel journal",
    palette: "soft blues, warm neutrals, muted greens, film tones",
    motifs: "photo frames, film borders, layered collage textures, caption strips",
  },
  retro: {
    mood: "retro, nostalgic, warm, vintage poster",
    palette: "mustard yellow, burnt orange, olive green, cream",
    motifs: "halftone texture, retro badges, geometric shapes, grain",
  },
  romantic: {
    mood: "romantic, soft, dreamy, elegant",
    palette: "blush pink, dusty rose, ivory, soft lavender",
    motifs: "delicate lines, floral accents, airy gradients, ribbon shapes",
  },
  modern: {
    mood: "modern, sleek, premium, structured",
    palette: "cool gray, navy, muted blue, crisp white",
    motifs: "clean grids, thin rules, subtle gradients, minimal icons",
  },
  nature: {
    mood: "natural, calm, organic, warm",
    palette: "sage green, earthy brown, sand beige, soft sky",
    motifs: "paper texture, leaf motifs, hand-drawn lines, gentle curves",
  },
  adventure: {
    mood: "adventurous, exploratory, bold travel poster",
    palette: "deep teal, sunrise orange, desert sand, navy",
    motifs: "map textures, stamps, compass icons, trail lines",
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
      "Use a clean editorial grid. Prioritize clarity, balanced sections, and readable negative space.",
  },
  collage: {
    name: "collage",
    layout:
      "Use overlapping photo frames, washi tape, and scrapbook layers. Make it lively but organized.",
  },
  notebook: {
    name: "notebook",
    layout:
      "Use paper textures, ruled areas, and sticky-note accents. Keep a handcrafted journal feel.",
  },
  timeline: {
    name: "timeline",
    layout:
      "Emphasize vertical timelines, dotted guides, and step markers. Make time flow the hero.",
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
      "Create a hero collage area centered vertically, with a clear title-safe zone at the top center and a slim info band near the bottom. Add subtle travel stickers or line art in corners.",
  },
  overview: {
    purpose: "overview/plan page",
    layout:
      "Use a wide scenic banner across the top 30%, then two or three clean info cards beneath. Include light separators and a small icon cluster near the header.",
  },
  schedule: {
    purpose: "daily schedule page",
    layout:
      "Include a left vertical timeline column with dotted markers, a right-side collage of 2-3 photo frames, and a memo box near the bottom with a dashed border.",
  },
  checklist: {
    purpose: "packing checklist page",
    layout:
      "Create two columns of checkbox lines with subtle dotted guides. Add a memo strip at the bottom and tiny icon accents near the header.",
  },
  info: {
    purpose: "information page",
    layout:
      "Compose two dashed-border info blocks (meeting place, cautions), plus a larger memo area. Keep margins wide and clean.",
  },
  memo: {
    purpose: "free memo page",
    layout:
      "Use a large lined or dotted paper area with plenty of blank space and a small corner icon.",
  },
};

const sanitize = (value: string, limit = 120): string => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit)}…`;
};

const formatList = (items: string[], limit = 5) => {
  return items
    .filter(Boolean)
    .slice(0, limit)
    .map((item) => sanitize(item, 60))
    .join(", ");
};

const buildBackgroundPrompt = (trip: Trip, mode: DesignMode) => {
  const guide = styleGuides[trip.templateType];
  const formatGuide = formatGuides[trip.formatType ?? "classic"];
  const modeGuide = modeGuides[mode];
  const destination = sanitize(trip.destination || "Unknown destination", 80);
  const title = sanitize(trip.title || "Travel booklet");
  const dates = trip.startDate && trip.endDate ? `${trip.startDate} to ${trip.endDate}` : "Dates TBD";
  const members = formatList(trip.members.map((member) => member.name));
  const wants = formatList(trip.wantItems.map((item) => item.text));
  const highlights = formatList(
    trip.dayPlans.flatMap((plan) => plan.activities.slice(0, 2)),
  );

  const sharedDetails = [
    `Destination: ${destination}.`,
    `Trip title: ${title}.`,
    `Travel dates: ${dates}.`,
    members ? `Travel members: ${members}.` : "",
    wants ? `Wish list items: ${wants}.` : "",
    highlights ? `Planned highlights: ${highlights}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    `You are a visual designer creating a printable ${modeGuide.purpose}.`,
    "Create a single full-bleed A4 portrait image with a clean, print-ready look.",
    `Style direction: ${guide.mood}. Palette: ${guide.palette}. Motifs: ${guide.motifs}.`,
    `Format direction (${formatGuide.name}): ${formatGuide.layout}`,
    "This page is part of a multi-page booklet; keep a consistent design system across pages.",
    "Make it Canva-like with layered collage elements, paper textures, and travel stickers.",
    modeGuide.layout,
    "Do NOT include any words, letters, numbers, logos, or UI labels.",
    "Keep text-safe zones calm and readable with light textures.",
    sharedDetails,
  ].join(" ");
};

const buildFullPrompt = (
  trip: Trip,
  mode: DesignMode,
  options: {
    pageNumber?: number;
    totalPages?: number;
    day?: number;
  },
) => {
  const guide = styleGuides[trip.templateType];
  const formatGuide = formatGuides[trip.formatType ?? "classic"];
  const modeGuide = modeGuides[mode];
  const pageNumber = options.pageNumber ?? 1;
  const totalPages = options.totalPages ?? 1;
  const destination = sanitize(trip.destination || "旅先", 80);
  const title = sanitize(trip.title || "旅のしおり", 80);
  const dates =
    trip.startDate && trip.endDate
      ? `${trip.startDate} 〜 ${trip.endDate}`
      : "日程未定";
  const members = formatList(trip.members.map((member) => member.name));
  const coverCopy = trip.aiContent?.coverCopy
    ? sanitize(trip.aiContent.coverCopy, 80)
    : "";
  const overviewText = trip.aiContent?.overviewText
    ? sanitize(trip.aiContent.overviewText, 160)
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
  const planTitle = plan ? `DAY ${plan.day}` : "DAY";
  const planDate = plan?.date ? `(${plan.date})` : "";
  const planSummary = plan
    ? trip.aiContent?.daySummaries[plan.day]
    : "";
  const activities = plan?.activities ?? [];
  const lodgingList = trip.lodgings.slice(0, 3);

  const textBlocks: string[] = [];

  if (mode === "cover") {
    textBlocks.push(`PAGE_TITLE: ${title}`);
    textBlocks.push(`DESTINATION: ${destination}`);
    textBlocks.push(`DATES: ${dates}`);
    if (members) textBlocks.push(`MEMBERS: ${members}`);
    if (coverCopy) textBlocks.push(`COVER_COPY: ${coverCopy}`);
  }

  if (mode === "overview") {
    textBlocks.push("PAGE_TITLE: 旅のプラン");
    if (overviewText) textBlocks.push(`OVERVIEW: ${overviewText}`);
    if (trip.transportText)
      textBlocks.push(`TRANSPORT: ${sanitize(trip.transportText, 120)}`);
    if (lodgingList.length > 0) {
      textBlocks.push(
        `LODGING: ${lodgingList
          .map((lodging) => sanitize(lodging.name, 60))
          .join(" / ")}`,
      );
    }
  }

  if (mode === "schedule") {
    textBlocks.push(`PAGE_TITLE: ${planTitle} ${planDate}`.trim());
    if (planSummary) {
      textBlocks.push(`HIGHLIGHT: ${sanitize(planSummary, 120)}`);
    }
    if (activities.length > 0) {
      textBlocks.push("SCHEDULE_ITEMS:");
      activities.slice(0, 10).forEach((activity, index) => {
        textBlocks.push(`${index + 1}. ${sanitize(activity, 80)}`);
      });
    }
  }

  if (mode === "checklist") {
    textBlocks.push("PAGE_TITLE: 持ち物リスト");
    if (packingList.length > 0) {
      textBlocks.push("PACKING:");
      packingList.slice(0, 12).forEach((item) => {
        textBlocks.push(`- ${sanitize(item, 80)}`);
      });
    }
    if (wantList.length > 0) {
      textBlocks.push("WISH_LIST:");
      wantList.slice(0, 10).forEach((item) => {
        textBlocks.push(`- ${sanitize(item, 80)}`);
      });
    }
  }

  if (mode === "info") {
    textBlocks.push("PAGE_TITLE: インフォメーション");
    if (lodgingList.length > 0) {
      textBlocks.push("LODGING:");
      lodgingList.forEach((lodging) => {
        textBlocks.push(
          `${sanitize(lodging.name, 60)} / ${
            lodging.address ? sanitize(lodging.address, 80) : "住所未入力"
          }`,
        );
      });
    }
    if (cautionsText) {
      textBlocks.push("NOTES:");
      cautionsText.split("\n").forEach((line) => {
        if (line.trim()) {
          textBlocks.push(`- ${sanitize(line, 100)}`);
        }
      });
    } else if (trip.notes) {
      textBlocks.push(`NOTES: ${sanitize(trip.notes, 160)}`);
    }
  }

  if (mode === "memo") {
    textBlocks.push("PAGE_TITLE: メモ");
    textBlocks.push("SUBTITLE: 自由記入スペース");
  }

  const textBlock = textBlocks.length
    ? textBlocks.join("\n")
    : "PAGE_TITLE: 旅のしおり";
  const modeHints: string[] = [];

  if (mode === "schedule") {
    modeHints.push(
      "Render SCHEDULE_ITEMS as a vertical timeline or numbered list in the given order. Do not add or remove items.",
    );
  }

  if (mode === "checklist") {
    modeHints.push(
      "Render PACKING and WISH_LIST as checklists with checkboxes. Do not add extra items.",
    );
  }

  return [
    `You are a visual designer creating a printable ${modeGuide.purpose}.`,
    "Output a single full-bleed A4 portrait page (aspect ratio 210:297, 2480x3508px).",
    "Render the provided text exactly as-is (keep Japanese or English as given); do not translate or rewrite.",
    "Do not add any extra words, dates, labels, or slogans beyond the provided text.",
    "If a section is empty, omit it entirely (no placeholders).",
    "Use a clear hierarchy: title > subtitle > body > lists.",
    "Keep text within a 12-15mm safe margin. Avoid clipping or overlaps.",
    "Place the page number at the bottom center as a small label in the format \"1/6\".",
    `Page number: ${pageNumber}/${totalPages}.`,
    `Style direction: ${guide.mood}. Palette: ${guide.palette}. Motifs: ${guide.motifs}.`,
    `Format direction (${formatGuide.name}): ${formatGuide.layout}`,
    "This page is part of a multi-page booklet; keep a consistent design system across pages.",
    "Layout guidance:",
    modeGuide.layout,
    ...modeHints,
    "Text content (labels like PAGE_TITLE are instructions only; render only the text after the colon and keep the order):",
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
    renderMode?: "background" | "full" | string;
    pageNumber?: number;
    totalPages?: number;
    day?: number;
  };

  if (!body.trip) {
    return NextResponse.json({ error: "Trip payload is required." }, { status: 400 });
  }

  const rawMode = body.mode ?? "cover";
  const normalizedMode =
    rawMode === "page" ? "overview" : String(rawMode || "cover");
  const mode: DesignMode =
    normalizedMode in modeGuides ? (normalizedMode as DesignMode) : "cover";
  const renderMode =
    body.renderMode === "background" ? "background" : "full";
  const prompt =
    renderMode === "background"
      ? buildBackgroundPrompt(body.trip, mode)
      : buildFullPrompt(body.trip, mode, {
          pageNumber: body.pageNumber,
          totalPages: body.totalPages,
          day: body.day,
        });

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
        temperature: 0.7,
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

  return NextResponse.json({
    base64,
    mimeType,
    prompt,
    mode,
  });
}
