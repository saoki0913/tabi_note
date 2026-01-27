import { FormatType } from "@/types/trip";
import { FormatModifier } from "../types";

const classicFormat: FormatModifier = {
  type: "classic",
  gridStyle: "clean",
  spacing: "balanced",
  elementDefaults: {
    textBoxStyle: "clean",
    imageStyle: "framed",
  },
};

const collageFormat: FormatModifier = {
  type: "collage",
  gridStyle: "overlap",
  spacing: "tight",
  elementDefaults: {
    textBoxStyle: "card",
    imageStyle: "polaroid",
  },
};

const notebookFormat: FormatModifier = {
  type: "notebook",
  gridStyle: "lined",
  spacing: "generous",
  elementDefaults: {
    textBoxStyle: "sticky",
    imageStyle: "borderless",
  },
};

const timelineFormat: FormatModifier = {
  type: "timeline",
  gridStyle: "vertical",
  spacing: "balanced",
  elementDefaults: {
    textBoxStyle: "ribbon",
    imageStyle: "masked",
  },
};

export const formatModifiers: Record<FormatType, FormatModifier> = {
  classic: classicFormat,
  collage: collageFormat,
  notebook: notebookFormat,
  timeline: timelineFormat,
};

export function getFormatModifier(type: FormatType): FormatModifier {
  return formatModifiers[type];
}
