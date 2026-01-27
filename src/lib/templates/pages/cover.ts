import { PageLayout } from "../types";
import { DEFAULT_FONTS } from "@/types/editor";

export const coverLayout: PageLayout = {
  mode: "cover",
  zones: [
    {
      id: "header-ornament",
      name: "Header Decoration",
      type: "header",
      position: { x: "center", y: 20, anchor: "topCenter" },
      size: { width: "fill", height: 40 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: {
        fontSize: 12,
        color: "#c9a227",
      },
    },
    {
      id: "main-title",
      name: "Trip Title",
      type: "title",
      position: { x: "center", y: 100, anchor: "topCenter" },
      size: { width: 500, height: 60, minWidth: 200, maxWidth: 550 },
      locked: false,
      resizable: true,
      deletable: false,
      defaultStyle: {
        fontSize: 42,
        fontFamily: DEFAULT_FONTS.display,
        fontWeight: 700,
        alignment: "center",
        color: "#1a1a2e",
      },
    },
    {
      id: "cover-copy",
      name: "Tagline",
      type: "content",
      position: { x: "center", y: 170, anchor: "topCenter" },
      size: { width: 400, height: 40, minWidth: 150, maxWidth: 450 },
      locked: false,
      resizable: true,
      deletable: true,
      defaultStyle: {
        fontSize: 16,
        fontFamily: DEFAULT_FONTS.body,
        fontWeight: 400,
        alignment: "center",
        color: "#6b6b7b",
        lineHeight: 1.6,
      },
    },
    {
      id: "hero-image",
      name: "Hero Image",
      type: "image",
      position: { x: "center", y: 240, anchor: "topCenter" },
      size: { width: 450, height: 280, minWidth: 200, minHeight: 150 },
      locked: false,
      resizable: true,
      deletable: true,
      defaultStyle: {
        borderRadius: 16,
        shadow: true,
        fit: "cover",
      },
    },
    {
      id: "destination-pill",
      name: "Destination",
      type: "content",
      position: { x: "center", y: 550, anchor: "topCenter" },
      size: { width: 200, height: 36 },
      locked: false,
      resizable: false,
      deletable: false,
      defaultStyle: {
        fontSize: 14,
        fontFamily: DEFAULT_FONTS.body,
        fontWeight: 500,
        alignment: "center",
        color: "#1a1a2e",
      },
    },
    {
      id: "date-range",
      name: "Trip Dates",
      type: "content",
      position: { x: "center", y: 600, anchor: "topCenter" },
      size: { width: 250, height: 32 },
      locked: false,
      resizable: false,
      deletable: false,
      defaultStyle: {
        fontSize: 13,
        fontFamily: DEFAULT_FONTS.ui,
        fontWeight: 400,
        alignment: "center",
        color: "#6b6b7b",
      },
    },
    {
      id: "members-list",
      name: "Members",
      type: "content",
      position: { x: "center", y: 650, anchor: "topCenter" },
      size: { width: 400, height: 30 },
      locked: false,
      resizable: true,
      deletable: true,
      defaultStyle: {
        fontSize: 12,
        fontFamily: DEFAULT_FONTS.body,
        fontWeight: 400,
        alignment: "center",
        color: "#8a8a9a",
      },
    },
    {
      id: "footer-decoration",
      name: "Footer Decoration",
      type: "footer",
      position: { x: "center", y: "bottom", anchor: "bottomCenter" },
      size: { width: "fill", height: 60 },
      locked: true,
      resizable: false,
      deletable: false,
      defaultStyle: {},
    },
  ],
  optionalSlots: [
    {
      id: "additional-image-1",
      type: "image",
      defaultPosition: { x: 60, y: 380 },
      defaultSize: { width: 100, height: 100 },
    },
    {
      id: "additional-image-2",
      type: "image",
      defaultPosition: { x: 435, y: 380 },
      defaultSize: { width: 100, height: 100 },
    },
  ],
  dataBindings: [
    { zoneId: "main-title", tripPath: "title" },
    { zoneId: "cover-copy", tripPath: "aiContent.coverCopy" },
    { zoneId: "destination-pill", tripPath: "destination" },
    {
      zoneId: "date-range",
      tripPath: "dates",
      transform: (value) => {
        const { startDate, endDate } = value as { startDate: string; endDate: string };
        return `${startDate} - ${endDate}`;
      },
    },
    {
      zoneId: "members-list",
      tripPath: "members",
      transform: (value) => {
        const members = value as { name: string }[];
        return members.map((m) => m.name).join(", ");
      },
    },
  ],
};
