import { NextResponse } from "next/server";
import type { DesignMode, TemplateType, Trip } from "@/types/trip";

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

const buildPrompt = (trip: Trip, mode: DesignMode) => {
  const guide = styleGuides[trip.templateType];
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
    "Make it Canva-like with layered collage elements, paper textures, and travel stickers.",
    modeGuide.layout,
    "Do NOT include any words, letters, numbers, logos, or UI labels.",
    "Keep text-safe zones calm and readable with light textures.",
    sharedDetails,
  ].join(" ");
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
  };

  if (!body.trip) {
    return NextResponse.json({ error: "Trip payload is required." }, { status: 400 });
  }

  const rawMode = body.mode ?? "cover";
  const normalizedMode =
    rawMode === "page" ? "overview" : String(rawMode || "cover");
  const mode: DesignMode =
    normalizedMode in modeGuides ? (normalizedMode as DesignMode) : "cover";
  const prompt = buildPrompt(body.trip, mode);

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
