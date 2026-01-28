"use client";

import type { TripDesignPage, TextLayer, TextLayerStyle } from "@/types/trip";
import { LayeredPage, LayerEdits } from "./LayeredPage";

// Page edits interface
interface PageEdits {
  // For layered pages - includes content, style, and position edits
  layerEdits?: LayerEdits;
  // New layers added by user
  newLayers?: TextLayer[];
}

interface PageRendererProps {
  page: TripDesignPage;
  index: number;
  edits?: PageEdits;
  // Layered callbacks
  onTextLayerUpdate?: (layerId: string, newContent: string) => void;
  onTextLayerStyleUpdate?: (layerId: string, style: Partial<TextLayerStyle>) => void;
  onTextLayerPositionUpdate?: (layerId: string, position: { x: number; y: number }) => void;
  onTextLayerSizeUpdate?: (layerId: string, size: { width: number; height: number }) => void;
  onLayerSelect?: (layerId: string | null) => void;
  selectedLayerId?: string | null;
}

/**
 * PageRenderer - Renders layered pages with HTML text overlays
 */
export function PageRenderer({
  page,
  index,
  edits,
  onTextLayerUpdate,
  onTextLayerStyleUpdate,
  onTextLayerPositionUpdate,
  onTextLayerSizeUpdate,
  onLayerSelect,
  selectedLayerId,
}: PageRendererProps) {
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
      onTextLayerSizeUpdate={onTextLayerSizeUpdate}
      onLayerSelect={onLayerSelect}
      selectedLayerId={selectedLayerId}
    />
  );
}

// Re-export for convenience
export { LayeredPage } from "./LayeredPage";
