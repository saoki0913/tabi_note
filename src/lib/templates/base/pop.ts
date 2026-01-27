import { BaseTemplate } from "../types";

export const popTemplate: BaseTemplate = {
  type: "pop",
  colors: {
    primary: "#c4654a",    // Terracotta
    secondary: "#c9a227",  // Gold
    accent: "#e07b5a",     // Coral
    background: "#f5f0e8", // Warm paper
    text: "#1a1a2e",       // Deep ink
    muted: "#6b6b7b",      // Warm gray
  },
  fonts: {
    display: "Cormorant Garamond",
    body: "Zen Kaku Gothic New",
    accent: "DM Sans",
  },
  styleHints: {
    mood: "cheerful, vibrant, warm, friendly, crafty",
    motifs: ["stickers", "rounded badges", "washi tape", "confetti", "hearts"],
    textures: ["paper grain", "soft gradients", "playful patterns"],
  },
};
