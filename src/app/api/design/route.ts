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
    typography: string;
    imagery: string;
  }
> = {
  minimal: {
    mood: "minimal, clean, airy, editorial, structured, warm ink on paper",
    palette:
      "ink deep #1a1a2e, paper cream #faf8f5, paper aged #ede4d4, warm gray accents",
    motifs: "thin rules, gentle grids, generous whitespace, subtle paper grain",
    typography:
      "Display font: Cormorant Garamond (headings). Body font: Zen Kaku Gothic New (Japanese). UI labels: DM Sans.",
    imagery:
      "Use one calm hero photo or line art illustration with thin outlines. No text on stickers.",
  },
  pop: {
    mood: "playful, vibrant, warm, friendly, craft-inspired but refined",
    palette:
      "terracotta #c4654a, gold #c9a227, paper warm #f5f0e8, coral #e07b5a",
    motifs: "stickers, rounded badges, washi tape, confetti accents",
    typography:
      "Display font: Cormorant Garamond (headings). Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use colorful collage blocks and sticker icons only (no sticker text). Keep visuals playful but readable.",
  },
  photo: {
    mood: "photo-forward, cinematic, serene travel journal",
    palette:
      "ocean #4a7c8f, sage #7d9471, paper warm #f5f0e8, muted charcoal",
    motifs: "photo frames, soft shadows, film grain, caption strips",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use 2-4 large photo frames with crisp white borders. Avoid busy textures behind text.",
  },
  retro: {
    mood: "retro, nostalgic, warm, vintage travel poster",
    palette:
      "paper aged #ede4d4, terracotta #c4654a, ink deep #1a1a2e, gold #c9a227",
    motifs: "halftone texture, stamps, retro badges, soft grain",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use retro iconography and textures. Any stamps should be icon-only (no words).",
  },
  romantic: {
    mood: "romantic, soft, airy, elegant",
    palette:
      "coral #e07b5a, paper cream #faf8f5, blush beige #f5e9e4, gold #c9a227",
    motifs: "delicate lines, soft gradients, ribbon shapes, small florals",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use soft floral ornaments and gentle photo frames. Keep text zones clean.",
  },
  modern: {
    mood: "modern, sleek, premium, structured, calm",
    palette:
      "ink deep #1a1a2e, paper warm #f5f0e8, ink medium #2d2d44, gold #c9a227",
    motifs: "clean grids, thin rules, geometric shapes, minimal icons",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use geometric blocks and subtle gradients with minimal iconography. No extra words.",
  },
  nature: {
    mood: "natural, calm, organic, warm",
    palette:
      "sage #7d9471, paper warm #f5f0e8, ink deep #1a1a2e, coral #e07b5a",
    motifs: "paper texture, leaf motifs, hand-drawn lines, gentle curves",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use organic textures and nature illustrations with soft photo accents.",
  },
  adventure: {
    mood: "adventurous, exploratory, bold travel poster",
    palette:
      "ocean #4a7c8f, terracotta #c4654a, paper aged #ede4d4, ink deep #1a1a2e",
    motifs: "map textures, stamps, compass icons, trail lines",
    typography:
      "Display font: Cormorant Garamond. Body font: Zen Kaku Gothic New. UI labels: DM Sans.",
    imagery:
      "Use map textures and compass icons. Stamps must be icon-only (no words).",
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

const formatList = (
  items: string[],
  limit = 0,
  separator = ", ",
) => {
  const filtered = items.filter(Boolean);
  const trimmed = limit > 0 ? filtered.slice(0, limit) : filtered;
  return trimmed.map((item) => sanitize(item, 60)).join(separator);
};

const buildBackgroundPrompt = (trip: Trip, mode: DesignMode) => {
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

  return [
    `You are a visual designer creating a printable ${modeGuide.purpose}.`,
    "Create a single full-bleed A4 portrait image with a clean, print-ready look.",
    `Style direction: ${guide.mood}. Palette: ${guide.palette}. Motifs: ${guide.motifs}.`,
    guide.typography,
    guide.imagery,
    `Format direction (${formatGuide.name}): ${formatGuide.layout}`,
    "This page is part of a multi-page booklet; keep a consistent design system across pages.",
    "Use collage elements, paper textures, and icon-only stickers. Avoid any sticker text.",
    modeGuide.layout,
    "Do NOT include any words, letters, numbers, logos, UI labels, or readable signage anywhere in the image.",
    "Avoid letter-like shapes in stamps, tickets, maps, badges, and signage.",
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
  const destination = trip.destination
    ? sanitize(trip.destination, 80)
    : "";
  const title = trip.title ? sanitize(trip.title, 80) : "";
  const dates =
    trip.startDate && trip.endDate
      ? `${trip.startDate} 〜 ${trip.endDate}`
      : "";
  const members = formatList(trip.members.map((member) => member.name), 0, "・");
  const coverCopy = trip.aiContent?.coverCopy
    ? sanitize(trip.aiContent.coverCopy, 60)
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
  const lodgingList = trip.lodgings;

  const textLines: string[] = [];

  if (mode === "cover") {
    textLines.push(title);
    if (coverCopy) textLines.push(coverCopy);
    if (destination) textLines.push(`目的地: ${destination}`);
    if (dates) textLines.push(`日程: ${dates}`);
    if (members) textLines.push(`メンバー: ${members}`);
  }

  if (mode === "overview") {
    textLines.push("旅のプラン");
    if (overviewText) textLines.push(`概要: ${overviewText}`);
    if (trip.transportText) {
      textLines.push(`移動: ${sanitize(trip.transportText, 120)}`);
    }
    if (lodgingList.length > 0) {
      textLines.push("宿泊先:");
      lodgingList.forEach((lodging) => {
        textLines.push(
          `・${sanitize(lodging.name, 80)}${
            lodging.address ? ` / ${sanitize(lodging.address, 120)}` : ""
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
      textLines.push(`見どころ: ${sanitize(planSummary, 120)}`);
    }
    if (activities.length > 0) {
      activities.forEach((activity, index) => {
        textLines.push(`${index + 1}. ${sanitize(activity, 80)}`);
      });
    }
  }

  if (mode === "checklist") {
    textLines.push("持ち物リスト");
    if (packingList.length > 0) {
      textLines.push("持ち物:");
      packingList.forEach((item) => {
        textLines.push(`□ ${sanitize(item, 90)}`);
      });
    }
    if (wantList.length > 0) {
      textLines.push("やりたいこと:");
      wantList.forEach((item) => {
        textLines.push(`□ ${sanitize(item, 90)}`);
      });
    }
  }

  if (mode === "info") {
    textLines.push("インフォメーション");
    if (lodgingList.length > 0) {
      textLines.push("宿泊先:");
      lodgingList.forEach((lodging) => {
        textLines.push(
          `・${sanitize(lodging.name, 80)}${
            lodging.address ? ` / ${sanitize(lodging.address, 120)}` : ""
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
          textLines.push(`・${sanitize(line, 100)}`);
        }
      });
    }
    if (trip.notes) {
      textLines.push("メモ:");
      trip.notes.split("\n").forEach((line) => {
        if (line.trim()) {
          textLines.push(`・${sanitize(line, 120)}`);
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
    "1) Render ONLY the provided text strings. Do not add, translate, or rephrase.",
    "2) Do not insert extra words like TRAVEL NOTES, DESTINATION, DATES, MEMBERS, ALOHA, VACATION, STEP, or stamps with text.",
    "3) Do not place any text on stickers or illustrations. Use icon-only stickers.",
    "4) If text is long, reduce font size, tighten spacing, or use multi-column layout. Do not omit any lines.",
    "5) Keep punctuation, small Japanese characters, and digits intact. Do not switch languages.",
    "Use a clear hierarchy: title > subtitle > body > lists.",
    "Keep text within a 12-15mm safe margin (about 140px). Avoid clipping or overlaps.",
    "Ensure text is crisp and high-contrast against the background for print readability.",
    "The last text line is the page number; place it at the bottom center as a small label.",
    `Style direction: ${guide.mood}. Palette: ${guide.palette}. Motifs: ${guide.motifs}.`,
    guide.typography,
    guide.imagery,
    `Format direction (${formatGuide.name}): ${formatGuide.layout}`,
    "This page is part of a multi-page booklet; keep a consistent design system across pages.",
    "Use warm paper textures, subtle grain, and soft shadows for depth. Avoid harsh neon colors.",
    "Layout guidance:",
    modeGuide.layout,
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
  const renderMode = body.renderMode === "background" ? "background" : "full";
  const prompt =
    renderMode === "background"
      ? buildBackgroundPrompt(body.trip, mode)
      : buildFullPrompt(body.trip, mode, {
          pageNumber: body.pageNumber,
          totalPages: body.totalPages,
          day: body.day,
        });
  const temperature = renderMode === "full" ? 0.25 : 0.6;

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

  return NextResponse.json({
    base64,
    mimeType,
    prompt,
    mode,
  });
}
