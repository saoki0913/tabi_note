import { DesignMode } from "@/types/trip";
import { PageLayout } from "../types";
import { coverLayout } from "./cover";

// Placeholder layouts for other pages (to be implemented in Phase 4)
const overviewLayout: PageLayout = {
  mode: "overview",
  zones: [
    {
      id: "header",
      name: "Page Header",
      type: "header",
      position: { x: "center", y: 20, anchor: "topCenter" },
      size: { width: "fill", height: 50 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: { fontSize: 24, fontWeight: 600, alignment: "center" },
    },
    {
      id: "overview-text",
      name: "Overview Text",
      type: "content",
      position: { x: "center", y: 100, anchor: "topCenter" },
      size: { width: 500, height: 120 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: { fontSize: 14, lineHeight: 1.8 },
    },
  ],
  optionalSlots: [],
  dataBindings: [
    { zoneId: "overview-text", tripPath: "aiContent.overviewText" },
  ],
};

const scheduleLayout: PageLayout = {
  mode: "schedule",
  zones: [
    {
      id: "day-header",
      name: "Day Header",
      type: "header",
      position: { x: "center", y: 20, anchor: "topCenter" },
      size: { width: "fill", height: 60 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: { fontSize: 28, fontWeight: 700, alignment: "center" },
    },
    {
      id: "activities-list",
      name: "Activities",
      type: "list",
      position: { x: 40, y: 120, anchor: "topLeft" },
      size: { width: 515, height: 600 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: { fontSize: 14, lineHeight: 2 },
    },
  ],
  optionalSlots: [
    {
      id: "day-photo",
      type: "image",
      defaultPosition: { x: 400, y: 150 },
      defaultSize: { width: 150, height: 150 },
    },
  ],
  dataBindings: [],
};

const checklistLayout: PageLayout = {
  mode: "checklist",
  zones: [
    {
      id: "header",
      name: "Checklist Header",
      type: "header",
      position: { x: "center", y: 20, anchor: "topCenter" },
      size: { width: "fill", height: 50 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: { fontSize: 24, fontWeight: 600, alignment: "center" },
    },
    {
      id: "packing-list",
      name: "Packing List",
      type: "list",
      position: { x: 40, y: 100, anchor: "topLeft" },
      size: { width: 250, height: 400 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: { fontSize: 13, lineHeight: 1.8 },
    },
    {
      id: "want-list",
      name: "Want to Do",
      type: "list",
      position: { x: 305, y: 100, anchor: "topLeft" },
      size: { width: 250, height: 400 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: { fontSize: 13, lineHeight: 1.8 },
    },
  ],
  optionalSlots: [],
  dataBindings: [
    { zoneId: "packing-list", tripPath: "aiContent.packingSuggestions" },
    { zoneId: "want-list", tripPath: "wantItems" },
  ],
};

const infoLayout: PageLayout = {
  mode: "info",
  zones: [
    {
      id: "header",
      name: "Info Header",
      type: "header",
      position: { x: "center", y: 20, anchor: "topCenter" },
      size: { width: "fill", height: 50 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: { fontSize: 24, fontWeight: 600, alignment: "center" },
    },
    {
      id: "lodging-info",
      name: "Lodging Info",
      type: "content",
      position: { x: 40, y: 100, anchor: "topLeft" },
      size: { width: 515, height: 300 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: { fontSize: 13, lineHeight: 1.6 },
    },
    {
      id: "cautions",
      name: "Cautions",
      type: "content",
      position: { x: 40, y: 420, anchor: "topLeft" },
      size: { width: 515, height: 200 },
      locked: false,
      resizable: true,
      deletable: true,
      defaultStyle: { fontSize: 12, lineHeight: 1.6 },
    },
  ],
  optionalSlots: [],
  dataBindings: [
    { zoneId: "lodging-info", tripPath: "lodgings" },
    { zoneId: "cautions", tripPath: "aiContent.cautionsText" },
  ],
};

const memoLayout: PageLayout = {
  mode: "memo",
  zones: [
    {
      id: "header",
      name: "Memo Header",
      type: "header",
      position: { x: "center", y: 20, anchor: "topCenter" },
      size: { width: "fill", height: 50 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: { fontSize: 24, fontWeight: 600, alignment: "center" },
    },
    {
      id: "memo-area",
      name: "Memo Area",
      type: "content",
      position: { x: 40, y: 100, anchor: "topLeft" },
      size: { width: 515, height: 680 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: { fontSize: 14, lineHeight: 2 },
    },
  ],
  optionalSlots: [],
  dataBindings: [{ zoneId: "memo-area", tripPath: "notes" }],
};

export const pageLayouts: Record<DesignMode, PageLayout> = {
  cover: coverLayout,
  overview: overviewLayout,
  schedule: scheduleLayout,
  checklist: checklistLayout,
  info: infoLayout,
  memo: memoLayout,
};

export function getPageLayout(mode: DesignMode): PageLayout {
  return pageLayouts[mode];
}

export { coverLayout };
