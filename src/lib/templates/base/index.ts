import { TemplateType } from "@/types/trip";
import { BaseTemplate } from "../types";
import { popTemplate } from "./pop";

// Minimal template
const minimalTemplate: BaseTemplate = {
  type: "minimal",
  colors: {
    primary: "#1a1a2e",
    secondary: "#ede4d4",
    accent: "#c9a227",
    background: "#faf8f5",
    text: "#1a1a2e",
    muted: "#8a8a9a",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "minimal, clean, airy, editorial, structured, warm",
    motifs: ["thin rules", "gentle grids", "abundant whitespace"],
    textures: ["subtle paper texture"],
  },
};

// Photo template
const photoTemplate: BaseTemplate = {
  type: "photo",
  colors: {
    primary: "#4a7c8f",
    secondary: "#7d9471",
    accent: "#f5f0e8",
    background: "#f5f0e8",
    text: "#2d2d44",
    muted: "#6b7b7b",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "photo-focused, cinematic, calm travel journal",
    motifs: ["photo frames", "soft shadows", "film grain", "caption strips"],
    textures: ["subtle vignette", "soft focus edges"],
  },
};

// Retro template
const retroTemplate: BaseTemplate = {
  type: "retro",
  colors: {
    primary: "#c4654a",
    secondary: "#ede4d4",
    accent: "#c9a227",
    background: "#ede4d4",
    text: "#1a1a2e",
    muted: "#7a6a5a",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "retro, nostalgic, warm, vintage travel poster",
    motifs: ["halftone textures", "stamps", "retro badges", "soft grain"],
    textures: ["aged paper", "worn edges"],
  },
};

// Romantic template
const romanticTemplate: BaseTemplate = {
  type: "romantic",
  colors: {
    primary: "#e07b5a",
    secondary: "#f5e9e4",
    accent: "#c9a227",
    background: "#faf8f5",
    text: "#1a1a2e",
    muted: "#9a8a8a",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "romantic, soft, airy, elegant",
    motifs: ["delicate lines", "soft gradients", "ribbon shapes", "small flowers"],
    textures: ["watercolor wash", "soft blush tones"],
  },
};

// Modern template
const modernTemplate: BaseTemplate = {
  type: "modern",
  colors: {
    primary: "#1a1a2e",
    secondary: "#2d2d44",
    accent: "#c9a227",
    background: "#f5f0e8",
    text: "#1a1a2e",
    muted: "#5a5a6a",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "modern, refined, premium, structured, calm",
    motifs: ["clean grids", "thin rules", "geometric shapes", "minimal icons"],
    textures: ["subtle gradients", "clean surfaces"],
  },
};

// Nature template
const natureTemplate: BaseTemplate = {
  type: "nature",
  colors: {
    primary: "#7d9471",
    secondary: "#f5f0e8",
    accent: "#e07b5a",
    background: "#f5f0e8",
    text: "#1a1a2e",
    muted: "#6a7a6a",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "natural, calm, organic, warm",
    motifs: ["paper textures", "leaf motifs", "hand-drawn lines", "gentle curves"],
    textures: ["organic textures", "natural patterns"],
  },
};

// Adventure template
const adventureTemplate: BaseTemplate = {
  type: "adventure",
  colors: {
    primary: "#4a7c8f",
    secondary: "#c4654a",
    accent: "#ede4d4",
    background: "#ede4d4",
    text: "#1a1a2e",
    muted: "#5a6a7a",
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "adventurous, exploratory, bold travel poster",
    motifs: ["map textures", "stamps", "compass icons", "trail lines"],
    textures: ["aged map", "adventure journal"],
  },
};

// Export all templates
export const baseTemplates: Record<TemplateType, BaseTemplate> = {
  minimal: minimalTemplate,
  pop: popTemplate,
  photo: photoTemplate,
  retro: retroTemplate,
  romantic: romanticTemplate,
  modern: modernTemplate,
  nature: natureTemplate,
  adventure: adventureTemplate,
};

export function getBaseTemplate(type: TemplateType): BaseTemplate {
  return baseTemplates[type];
}
