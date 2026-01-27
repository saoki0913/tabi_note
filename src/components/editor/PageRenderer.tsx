"use client";

import type { TripDesignPage, TextLayer, TextLayerStyle } from "@/types/trip";
import type { AnalysisResult } from "@/lib/analysis/types";
import { EditablePage } from "./EditablePage";
import { LayeredPage, LayerEdits } from "./LayeredPage";

// Unified edits interface
interface PageEdits {
  // For legacy pages (OCR-based)
  textEdits?: Map<string, string>;
  // For layered pages - now includes content, style, and position edits
  layerEdits?: LayerEdits;
  // New layers added by user
  newLayers?: TextLayer[];
}

interface PageRendererProps {
  page: TripDesignPage;
  index: number;
  edits?: PageEdits;
  // Legacy callbacks
  onTextUpdate?: (regionId: string, newContent: string) => void;
  onAnalysisComplete?: (pageId: string, result: AnalysisResult) => void;
  // Layered callbacks
  onTextLayerUpdate?: (layerId: string, newContent: string) => void;
  onTextLayerStyleUpdate?: (layerId: string, style: Partial<TextLayerStyle>) => void;
  onTextLayerPositionUpdate?: (layerId: string, position: { x: number; y: number }) => void;
  onLayerSelect?: (layerId: string | null) => void;
  onAddLayer?: (layer: TextLayer) => void;
  selectedLayerId?: string | null;
}

/**
 * PageRenderer - Routes between legacy (OCR-based) and layered (HTML text overlay) rendering
 *
 * This component decides which rendering mode to use based on the page's renderType:
 * - "layered": Uses LayeredPage with HTML text overlays (new architecture)
 * - "legacy" or undefined: Uses EditablePage with OCR-based text detection (existing)
 */
export function PageRenderer({
  page,
  index,
  edits,
  onTextUpdate,
  onAnalysisComplete,
  onTextLayerUpdate,
  onTextLayerStyleUpdate,
  onTextLayerPositionUpdate,
  onLayerSelect,
  onAddLayer,
  selectedLayerId,
}: PageRendererProps) {
  // Route based on renderType
  if (page.renderType === "layered" && page.textLayers) {
    // New layered architecture
    return (
      <LayeredPage
        page={page}
        index={index}
        editable={true}
        edits={edits?.layerEdits}
        newLayers={edits?.newLayers}
        onTextLayerUpdate={onTextLayerUpdate}
        onTextLayerStyleUpdate={onTextLayerStyleUpdate}
        onTextLayerPositionUpdate={onTextLayerPositionUpdate}
        onLayerSelect={onLayerSelect}
        onAddLayer={onAddLayer}
        selectedLayerId={selectedLayerId}
      />
    );
  }

  // Legacy OCR-based architecture
  return (
    <EditablePage
      page={page}
      index={index}
      edits={edits ? { textEdits: edits.textEdits || new Map() } : undefined}
      onTextUpdate={onTextUpdate || (() => {})}
      onAnalysisComplete={onAnalysisComplete}
    />
  );
}

// Re-export for convenience
export { EditablePage } from "./EditablePage";
export { LayeredPage } from "./LayeredPage";
