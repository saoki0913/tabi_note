import type { AiContent, Trip, TripDesignPage, TextLayer } from "@/types/trip";
import type { DataBinding } from "@/types/editor";
import { getPageLayout } from "@/lib/templates";
import { getVariantForMode } from "@/lib/templates/variants";
import { generateTextLayers } from "@/lib/layers";
import { generateId } from "@/lib/storage";

export type QuickEditBinding = {
  tripPath: string;
  day?: number;
  itemIndex?: number;
};

export type QuickEditLayer = {
  id: string;
  textLayer: TextLayer;
  originalText: string;
  editedText: string;
  editable: boolean;
  binding?: QuickEditBinding;
};

const EDITABLE_PATHS = new Set([
  "title",
  "destination",
  "notes",
  "dates",
  "members",
  "dayPlan.activities",
  "wantItems",
  "aiContent.coverCopy",
  "aiContent.overviewText",
  "aiContent.cautionsText",
  "aiContent.packingSuggestions",
]);

const LIST_PATHS = new Set([
  "dayPlan.activities",
  "wantItems",
  "aiContent.packingSuggestions",
]);

function isEditableTripPath(tripPath: string): boolean {
  if (tripPath.startsWith("aiContent.")) return true;
  return EDITABLE_PATHS.has(tripPath);
}

function parseLayerBinding(
  layerId: string,
  bindings: DataBinding[],
): { binding?: DataBinding; itemIndex?: number } {
  const itemMatch = layerId.match(/^(.*)-item-(\d+)$/);
  const zoneId = itemMatch ? itemMatch[1] : layerId;
  const itemIndex = itemMatch ? Number(itemMatch[2]) : undefined;
  const binding = bindings.find((entry) => entry.zoneId === zoneId);
  return { binding, itemIndex };
}

export function generateQuickEditLayers(
  trip: Trip,
  page: TripDesignPage,
): QuickEditLayer[] {
  const layout = getPageLayout(page.mode);
  const variant = page.variantId
    ? getVariantForMode(page.mode, page.variantId) ?? null
    : null;
  const textLayers = generateTextLayers(trip, page.mode, page.day, variant);

  return textLayers
    .map((layer) => {
      const { binding, itemIndex } = parseLayerBinding(layer.id, layout.dataBindings);
      if (!binding) return null;

      const editable = isEditableTripPath(binding.tripPath);
      if (!editable) return null;

      if (LIST_PATHS.has(binding.tripPath) && itemIndex === undefined) {
        return null;
      }

      const bindingInfo: QuickEditBinding = {
        tripPath: binding.tripPath,
        day: page.day,
        itemIndex,
      };

      return {
        id: layer.id,
        textLayer: layer,
        originalText: layer.content,
        editedText: layer.content,
        editable: true,
        binding: bindingInfo,
      } satisfies QuickEditLayer;
    })
    .filter((layer): layer is QuickEditLayer => Boolean(layer));
}

function ensureAiContent(trip: Trip): AiContent {
  if (trip.aiContent) return trip.aiContent;
  const aiContent: AiContent = {
    coverCopy: "",
    overviewText: "",
    daySummaries: {},
    cautionsText: "",
    packingSuggestions: [],
  };
  trip.aiContent = aiContent;
  return aiContent;
}

function parseMemberNames(value: string): string[] {
  return value
    .split(/[\n、,・]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function parseDateRange(value: string): { start?: string; end?: string } {
  const text = value.trim();
  if (!text) return {};
  const match = text.match(
    /(.+?)(?:\s*[〜～]\s*|\s+to\s+|\s+-\s+|\s+–\s+|\s+—\s+)(.+)/i,
  );
  if (!match) return {};
  const start = match[1]?.trim();
  const end = match[2]?.trim();
  if (!start || !end) return {};
  return { start, end };
}

export function applyQuickEditChanges(
  trip: Trip,
  layers: QuickEditLayer[],
): Trip {
  const editedLayers = layers.filter(
    (layer) =>
      layer.editable &&
      layer.binding &&
      layer.editedText !== layer.originalText,
  );
  if (!editedLayers.length) return trip;

  const nextTrip: Trip = JSON.parse(JSON.stringify(trip));

  for (const layer of editedLayers) {
    const binding = layer.binding;
    if (!binding) continue;

    const value = layer.editedText.trim();

    switch (binding.tripPath) {
      case "title":
        nextTrip.title = value;
        break;
      case "destination":
        nextTrip.destination = value;
        break;
      case "notes":
        nextTrip.notes = value;
        break;
      case "aiContent.coverCopy":
        ensureAiContent(nextTrip).coverCopy = value;
        break;
      case "aiContent.overviewText":
        ensureAiContent(nextTrip).overviewText = value;
        break;
      case "aiContent.cautionsText":
        ensureAiContent(nextTrip).cautionsText = value;
        break;
      case "aiContent.packingSuggestions": {
        const aiContent = ensureAiContent(nextTrip);
        const index = binding.itemIndex ?? -1;
        if (index >= 0 && index < aiContent.packingSuggestions.length) {
          aiContent.packingSuggestions[index] = value;
        }
        break;
      }
      case "wantItems": {
        const index = binding.itemIndex ?? -1;
        if (index >= 0 && index < nextTrip.wantItems.length) {
          nextTrip.wantItems[index].text = value;
        }
        break;
      }
      case "dayPlan.activities": {
        const day = binding.day;
        const index = binding.itemIndex ?? -1;
        if (day === undefined || index < 0) break;
        const plan = nextTrip.dayPlans.find((item) => item.day === day);
        if (!plan || index >= plan.activities.length) break;
        plan.activities[index] = value;
        break;
      }
      case "members": {
        const names = parseMemberNames(value);
        const existing = nextTrip.members || [];
        nextTrip.members = names.map((name, index) => ({
          id: existing[index]?.id ?? generateId(),
          name,
        }));
        break;
      }
      case "dates": {
        const { start, end } = parseDateRange(value);
        if (start && end) {
          nextTrip.startDate = start;
          nextTrip.endDate = end;
        }
        break;
      }
      default:
        break;
    }
  }

  return nextTrip;
}
