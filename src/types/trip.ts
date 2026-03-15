export interface Member {
  id: string;
  name: string;
}

export interface Lodging {
  id: string;
  name: string;
  address: string;
  checkin: string;
  checkout: string;
  url: string;
  phone: string;
  memo: string;
}

export interface WantItem {
  id: string;
  text: string;
  category?: string;
  sortOrder: number;
}

export interface DayPlan {
  day: number;
  date: string;
  activities: string[];
}

export interface AiContent {
  coverCopy: string;
  overviewText: string;
  daySummaries: Record<number, string>;
  cautionsText: string;
  packingSuggestions: string[];
}

export interface TripDesignImage {
  mimeType: string;
  base64: string;
  prompt?: string;
  createdAt: string;
}

export type DesignMode =
  | "cover"
  | "overview"
  | "schedule"
  | "checklist"
  | "info"
  | "memo";

export type FormatType = "classic" | "collage" | "notebook" | "timeline";
export type DesignRenderMode = "full" | "layered";
export type PageRenderType = "legacy" | "layered";

// Zone types for text layer classification
export type ZoneType =
  | "title"
  | "subtitle"
  | "body"
  | "date"
  | "members"
  | "list-item"
  | "caption"
  | "label"
  | "header"
  | "footer";

// Text layer style definition
export interface TextLayerStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  alignment: "left" | "center" | "right";
  lineHeight: number;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  letterSpacing?: number;
}

// Editable text line for FULL mode editing
export interface EditableTextLine {
  id: string;
  content: string;
  order: number;
}

// Page-wide style for FULL mode
export interface FullModePageStyle {
  fontFamily?: string;
  primaryColor?: string;
}

// Text layer for layered page rendering
export interface TextLayer {
  id: string;
  zoneType: ZoneType;
  content: string;
  // Normalized coordinates (0-1 relative to page size)
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: TextLayerStyle;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  // Flag to indicate user-added layers (not from template)
  isUserAdded?: boolean;
}

export interface TripDesignPage {
  id: string;
  mode: DesignMode;
  label: string;
  day?: number;
  pageNumber: number;
  totalPages: number;
  variantId?: string;
  variantName?: string;
  mimeType: string;
  // For legacy: complete image with text
  // For layered: background image only (no text)
  base64: string;
  prompt?: string;
  createdAt: string;

  // === New fields for layered rendering ===
  // Page render type: "legacy" (OCR-based) or "layered" (HTML text overlay)
  renderType?: PageRenderType;
  // Text layers for layered pages (only when renderType="layered")
  textLayers?: TextLayer[];

  // Editor state (JSON stringified CanvasElement[]) - legacy support
  editorElements?: string;
  // Whether the page has been edited
  isEdited?: boolean;

  // === Fields for FULL mode editing ===
  // Editable text lines for FULL mode pages
  editableTextLines?: EditableTextLine[];
  // Page-wide style settings for FULL mode
  fullModeStyle?: FullModePageStyle;
  // Persistent storage references
  assetKey?: string;
  previewKey?: string;
  originalAssetKey?: string;
  revision?: number;
}

export interface TripDesign {
  style: TemplateType;
  format: FormatType;
  renderMode: DesignRenderMode;
  assets?: Partial<Record<DesignMode, TripDesignImage>>;
  pages?: TripDesignPage[];
  updatedAt: string;
}

export type TemplateType =
  | "minimal"
  | "pop"
  | "photo"
  | "retro"
  | "romantic"
  | "modern"
  | "nature"
  | "adventure";

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  transportText: string;
  notes: string;
  members: Member[];
  lodgings: Lodging[];
  wantItems: WantItem[];
  dayPlans: DayPlan[];
  templateType: TemplateType;
  formatType: FormatType;
  aiEnabled: boolean;
  aiTone: "polite" | "casual";
  aiContent?: AiContent;
  design?: TripDesign;
  shareToken?: string;
  ownerId?: string | null;
  coverPreviewDataUrl?: string;
  status?: "draft" | "ready" | "shared";
  createdAt: string;
  updatedAt: string;
}
