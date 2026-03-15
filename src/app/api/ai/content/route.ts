import { NextResponse } from "next/server";
import type { AiContent, Trip } from "@/types/trip";
import { generateAiContent } from "@/lib/ai";

const MODEL_ID = process.env.GEMINI_TEXT_MODEL ?? "gemini-1.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const sanitize = (value: string, limit = 120): string => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return `${cleaned.slice(0, limit)}…`;
};

const normalizeText = (value: string): string =>
  value.replace(/\r\n/g, "\n").trim();

const buildTripSummary = (trip: Trip) => {
  const dates = trip.startDate && trip.endDate
    ? `${trip.startDate} 〜 ${trip.endDate}`
    : "";

  return {
    title: sanitize(trip.title || ""),
    destination: sanitize(trip.destination || ""),
    dates,
    members: trip.members.map((member) => sanitize(member.name || "", 40)).filter(Boolean),
    transport: sanitize(trip.transportText || "", 160),
    lodgings: trip.lodgings.map((lodging) => ({
      name: sanitize(lodging.name || "", 80),
      address: sanitize(lodging.address || "", 120),
      checkin: sanitize(lodging.checkin || "", 20),
      checkout: sanitize(lodging.checkout || "", 20),
    })),
    wantItems: trip.wantItems.map((item) => sanitize(item.text || "", 60)).filter(Boolean),
    notes: sanitize(trip.notes || "", 200),
    dayPlans: trip.dayPlans.map((plan) => ({
      day: plan.day,
      date: plan.date,
      activities: plan.activities
        .map((activity) => sanitize(activity || "", 60))
        .filter(Boolean)
        .slice(0, 8),
    })),
    tone: trip.aiTone,
  };
};

const buildPrompt = (trip: Trip, draft: AiContent) => {
  const tripSummary = buildTripSummary(trip);

  return [
    "You are a Japanese copywriter for a travel booklet.",
    `Tone: ${trip.aiTone === "polite" ? "polite" : "casual"}.`,
    "Rewrite the DRAFT_JSON to be more natural, friendly, and useful.",
    "Use ONLY facts from TRIP_DATA. Do not invent destinations, dates, activities, or people.",
    "Keep output concise and readable.",
    "Rules:",
    "- coverCopy: 20-45 Japanese characters, lively but factual.",
    "- overviewText: 80-180 characters, mention destination, dates, group size, transport if available.",
    "- daySummaries: one short sentence per day with activities; use day numbers as keys.",
    "- cautionsText: 3-5 bullet lines using '・' and newlines.",
    "- packingSuggestions: 6-10 short noun phrases.",
    "Return JSON ONLY with keys: coverCopy, overviewText, daySummaries, cautionsText, packingSuggestions.",
    "TRIP_DATA:",
    JSON.stringify(tripSummary, null, 2),
    "DRAFT_JSON:",
    JSON.stringify(draft, null, 2),
  ].join("\n");
};

const extractJson = (text: string): string => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
};

const normalizeAiContent = (payload: unknown, fallback: AiContent): AiContent => {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as Record<string, unknown>;

  const coverCopy = typeof data.coverCopy === "string" && data.coverCopy.trim()
    ? normalizeText(data.coverCopy)
    : fallback.coverCopy;
  const overviewText = typeof data.overviewText === "string" && data.overviewText.trim()
    ? normalizeText(data.overviewText)
    : fallback.overviewText;
  const cautionsText = typeof data.cautionsText === "string" && data.cautionsText.trim()
    ? normalizeText(data.cautionsText)
    : fallback.cautionsText;

  const packingSuggestions = Array.isArray(data.packingSuggestions)
    ? data.packingSuggestions
        .map((item) => (typeof item === "string" ? normalizeText(item) : ""))
        .filter(Boolean)
    : fallback.packingSuggestions;

  const daySummaries: Record<number, string> = { ...fallback.daySummaries };
  if (data.daySummaries && typeof data.daySummaries === "object") {
    Object.entries(data.daySummaries as Record<string, unknown>).forEach(([key, value]) => {
      const day = Number(key);
      if (!Number.isNaN(day) && typeof value === "string" && value.trim()) {
        daySummaries[day] = normalizeText(value);
      }
    });
  }

  return {
    coverCopy,
    overviewText,
    daySummaries,
    cautionsText,
    packingSuggestions,
  };
};

export async function POST(request: Request) {
  let trip: Trip | undefined;
  try {
    const body = (await request.json()) as { trip?: Trip };
    trip = body.trip;
    if (!trip) {
      return NextResponse.json({ error: "Trip payload is required." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const draft = generateAiContent(trip);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ aiContent: draft, source: "fallback" });
  }

  const prompt = buildPrompt(trip, draft);
  try {
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
          temperature: 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini text generation failed:", errorText);
      return NextResponse.json({ aiContent: draft, source: "fallback" });
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = json.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json({ aiContent: draft, source: "fallback" });
    }

    const extracted = extractJson(text);
    try {
      const parsed = JSON.parse(extracted);
      const aiContent = normalizeAiContent(parsed, draft);
      return NextResponse.json({ aiContent, source: "gemini" });
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      return NextResponse.json({ aiContent: draft, source: "fallback" });
    }
  } catch (error) {
    console.error("AI content generation failed:", error);
    return NextResponse.json({ aiContent: draft, source: "fallback" });
  }
}
