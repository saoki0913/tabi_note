import type { Trip, DesignMode, EditableTextLine } from "@/types/trip";

/**
 * Normalize text by trimming and replacing multiple spaces
 */
const normalizeText = (value: string): string =>
  value.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();

/**
 * Join list items with a separator
 */
const joinList = (items: string[], separator = "・") =>
  items
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join(separator);

/**
 * Extract text lines from Trip data for FULL mode editing.
 * This mirrors the logic in buildFullPrompt from /api/design/route.ts
 */
export function extractTextLinesFromTrip(
  trip: Trip,
  mode: DesignMode,
  options?: {
    day?: number;
    pageNumber?: number;
    totalPages?: number;
    appendPageLabel?: boolean;
  }
): EditableTextLine[] {
  const pageNumber = options?.pageNumber ?? 1;
  const totalPages = options?.totalPages ?? 1;
  const appendPageLabel = options?.appendPageLabel !== false;

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
  const cautionsText = trip.aiContent?.cautionsText || "";
  const packingList = trip.aiContent?.packingSuggestions ?? [];
  const wantList = trip.wantItems.map((item) => item.text);

  // For schedule mode
  const plan =
    mode === "schedule"
      ? trip.dayPlans.find((entry) => entry.day === options?.day) ??
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
          }`
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
          }`
        );
      });
    }
    if (cautionsText) {
      textLines.push("注意事項:");
      cautionsText.split("\n").forEach((line) => {
        const trimmed = normalizeText(line);
        if (trimmed) {
          textLines.push(trimmed);
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

  // Add page label
  const pageLabel = `${pageNumber}/${totalPages}`;
  if (appendPageLabel && textLines[textLines.length - 1] !== pageLabel) {
    textLines.push(pageLabel);
  }

  // Convert to EditableTextLine format
  return textLines.map((content, index) => ({
    id: `line-${Date.now()}-${index}`,
    content,
    order: index,
  }));
}

/**
 * Convert EditableTextLine array to simple string array for API
 */
export function editableLinesToTextLines(lines: EditableTextLine[]): string[] {
  return lines
    .sort((a, b) => a.order - b.order)
    .map((line) => line.content)
    .filter(Boolean);
}
