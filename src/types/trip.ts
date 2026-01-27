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
export type DesignRenderMode = "background" | "full";

export interface TripDesignPage {
  id: string;
  mode: DesignMode;
  label: string;
  day?: number;
  pageNumber: number;
  totalPages: number;
  mimeType: string;
  base64: string;
  prompt?: string;
  createdAt: string;
  // Editor state (JSON stringified CanvasElement[])
  editorElements?: string;
  // Whether the page has been edited
  isEdited?: boolean;
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
  createdAt: string;
  updatedAt: string;
}
