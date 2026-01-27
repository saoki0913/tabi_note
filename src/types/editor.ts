import { DesignMode, TemplateType, FormatType } from "./trip";

// Canvas element types
export type ElementType = "text" | "image" | "decoration";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Text element data
export interface TextElementData {
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  alignment: "left" | "center" | "right";
  lineHeight: number;
  maxWidth?: number;
}

// Image element data
export interface ImageElementData {
  src: string;
  aspectRatio: number;
  fit: "contain" | "cover" | "fill";
  borderRadius: number;
  shadow: boolean;
}

// Decoration element data
export interface DecorationElementData {
  decorationType: "circle" | "line" | "stamp" | "tape" | "icon";
  color: string;
  opacity: number;
}

// Canvas element
export interface CanvasElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  rotation: number;
  locked: boolean;
  visible: boolean;
  layer: number;
  textData?: TextElementData;
  imageData?: ImageElementData;
  decorationData?: DecorationElementData;
}

// Page state
export interface PageState {
  pageKey: string;
  mode: DesignMode;
  day?: number;
  elements: CanvasElement[];
  aiBackground?: {
    base64: string;
    mimeType: string;
  };
}

// History entry for undo/redo
export interface HistoryEntry {
  timestamp: number;
  pages: Map<string, PageState>;
  selectedElementId: string | null;
}

// Editor state
export interface EditorState {
  currentPage: DesignMode;
  currentDayIndex?: number;
  pages: Map<string, PageState>;
  selectedElementId: string | null;
  selectedElements: string[];
  history: HistoryEntry[];
  historyIndex: number;
  zoom: number;
  panOffset: Position;
  showGrid: boolean;
  isLoading: boolean;
}

// Template zone (layout area)
export interface LayoutZone {
  id: string;
  name: string;
  type: "header" | "title" | "content" | "footer" | "image" | "list";
  position: {
    x: number | "left" | "center" | "right";
    y: number | "top" | "middle" | "bottom";
    anchor:
      | "topLeft"
      | "topCenter"
      | "topRight"
      | "centerLeft"
      | "center"
      | "centerRight"
      | "bottomLeft"
      | "bottomCenter"
      | "bottomRight";
  };
  size: {
    width: number | "auto" | "fill";
    height: number | "auto" | "fill";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  locked: boolean;
  resizable: boolean;
  deletable: boolean;
  defaultStyle: Partial<TextElementData & ImageElementData>;
}

// Data binding for template zones
export interface DataBinding {
  zoneId: string;
  tripPath: string;
  transform?: (value: unknown) => string;
}

// Page layout definition
export interface PageLayout {
  mode: DesignMode;
  zones: LayoutZone[];
  optionalSlots: {
    id: string;
    type: ElementType;
    defaultPosition: Position;
    defaultSize: Size;
  }[];
  dataBindings: DataBinding[];
}

// Base template definition
export interface BaseTemplate {
  type: TemplateType;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  fonts: {
    display: string;
    body: string;
    accent: string;
  };
  styleHints: {
    mood: string;
    motifs: string[];
    textures: string[];
  };
}

// Format modifier
export interface FormatModifier {
  type: FormatType;
  gridStyle: "clean" | "overlap" | "lined" | "vertical";
  spacing: "generous" | "tight" | "balanced";
  elementDefaults: {
    textBoxStyle: "clean" | "card" | "sticky" | "ribbon";
    imageStyle: "framed" | "borderless" | "polaroid" | "masked";
  };
}

// Combined template definition
export interface TemplateDefinition {
  base: BaseTemplate;
  format: FormatModifier;
  layout: PageLayout;
}

// Editor actions
export type EditorAction =
  | { type: "SET_PAGE"; page: DesignMode; dayIndex?: number }
  | { type: "SELECT_ELEMENT"; elementId: string | null }
  | { type: "SELECT_ELEMENTS"; elementIds: string[] }
  | { type: "UPDATE_ELEMENT"; elementId: string; updates: Partial<CanvasElement> }
  | { type: "ADD_ELEMENT"; element: CanvasElement }
  | { type: "REMOVE_ELEMENT"; elementId: string }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAN"; offset: Position }
  | { type: "TOGGLE_GRID" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "LOAD_PAGE_STATE"; pageState: PageState }
  | { type: "SET_BACKGROUND"; pageKey: string; background: { base64: string; mimeType: string } };

// Canvas dimensions (A4 at 72 DPI)
export const CANVAS_WIDTH = 595;
export const CANVAS_HEIGHT = 842;
export const CANVAS_ASPECT_RATIO = 210 / 297;

// Default font families
export const DEFAULT_FONTS = {
  display: "Cormorant Garamond",
  body: "Zen Kaku Gothic New",
  ui: "DM Sans",
};

// Helper to generate page key
export function getPageKey(mode: DesignMode, day?: number): string {
  if (mode === "schedule" && day !== undefined) {
    return `${mode}-${day}`;
  }
  return mode;
}

// Helper to create default text element
export function createTextElement(
  id: string,
  content: string,
  position: Position,
  options: Partial<TextElementData> = {}
): CanvasElement {
  return {
    id,
    type: "text",
    position,
    size: { width: 200, height: 50 },
    rotation: 0,
    locked: false,
    visible: true,
    layer: 1,
    textData: {
      content,
      fontSize: 16,
      fontFamily: DEFAULT_FONTS.body,
      fontWeight: 400,
      color: "#1a1a2e",
      alignment: "left",
      lineHeight: 1.5,
      ...options,
    },
  };
}

// Helper to create default image element
export function createImageElement(
  id: string,
  src: string,
  position: Position,
  size: Size,
  options: Partial<ImageElementData> = {}
): CanvasElement {
  return {
    id,
    type: "image",
    position,
    size,
    rotation: 0,
    locked: false,
    visible: true,
    layer: 1,
    imageData: {
      src,
      aspectRatio: size.width / size.height,
      fit: "cover",
      borderRadius: 0,
      shadow: false,
      ...options,
    },
  };
}
