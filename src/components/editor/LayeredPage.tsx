"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Feather, Layers } from "lucide-react";
import type { TripDesignPage, TextLayer, TextLayerStyle } from "@/types/trip";
import { TextLayerRenderer } from "./TextLayerRenderer";

// Edit tracking for a single layer
interface LayerEdit {
  content?: string;
  style?: Partial<TextLayerStyle>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// All edits for a page - exported for use in PageRenderer
export interface LayerEdits {
  layerUpdates: Map<string, LayerEdit>;
}

interface LayeredPageProps {
  page: TripDesignPage;
  index: number;
  editable: boolean;
  edits?: LayerEdits;
  newLayers?: TextLayer[];
  onTextLayerUpdate?: (layerId: string, newContent: string) => void;
  onTextLayerStyleUpdate?: (layerId: string, style: Partial<TextLayerStyle>) => void;
  onTextLayerPositionUpdate?: (layerId: string, position: { x: number; y: number }) => void;
  onTextLayerSizeUpdate?: (layerId: string, size: { width: number; height: number }) => void;
  onLayerSelect?: (layerId: string | null) => void;
  selectedLayerId?: string | null;
}

// Calculate actual image display area within container (accounting for object-contain)
interface ImageDisplayArea {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

function calculateImageDisplayArea(
  containerWidth: number,
  containerHeight: number,
  imageNaturalWidth: number,
  imageNaturalHeight: number
): ImageDisplayArea {
  if (containerWidth === 0 || containerHeight === 0 || imageNaturalWidth === 0 || imageNaturalHeight === 0) {
    return { width: containerWidth, height: containerHeight, offsetX: 0, offsetY: 0 };
  }

  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageNaturalWidth / imageNaturalHeight;

  let displayWidth: number;
  let displayHeight: number;

  if (imageAspect > containerAspect) {
    // Image is wider relative to container - fit to width
    displayWidth = containerWidth;
    displayHeight = containerWidth / imageAspect;
  } else {
    // Image is taller relative to container - fit to height
    displayHeight = containerHeight;
    displayWidth = containerHeight * imageAspect;
  }

  // Calculate offset for centering (object-contain centers the image)
  const offsetX = (containerWidth - displayWidth) / 2;
  const offsetY = (containerHeight - displayHeight) / 2;

  return { width: displayWidth, height: displayHeight, offsetX, offsetY };
}

export function LayeredPage(props: LayeredPageProps) {
  const {
    page,
    index,
    editable,
    edits,
    newLayers,
    onTextLayerUpdate,
    // onTextLayerStyleUpdate - style updates are handled via EditPanel
    onTextLayerPositionUpdate,
    onTextLayerSizeUpdate,
    onLayerSelect,
    selectedLayerId,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

  // Calculate actual image display area
  const imageDisplayArea = useMemo(() => {
    return calculateImageDisplayArea(
      containerSize.width,
      containerSize.height,
      imageNaturalSize.width,
      imageNaturalSize.height
    );
  }, [containerSize, imageNaturalSize]);

  // Get text layers from page including new user-added layers
  const allLayers = useMemo(() => {
    const baseLayers = page.textLayers || [];
    const addedLayers = newLayers || [];
    return [...baseLayers, ...addedLayers];
  }, [page.textLayers, newLayers]);

  // Get current layer state with all edits applied (content, style, position, size)
  const getLayerWithEdits = useCallback((layer: TextLayer): TextLayer => {
    const layerEdit = edits?.layerUpdates.get(layer.id);
    if (!layerEdit) {
      return layer;
    }

    return {
      ...layer,
      content: layerEdit.content !== undefined ? layerEdit.content : layer.content,
      position: layerEdit.position !== undefined ? layerEdit.position : layer.position,
      size: layerEdit.size !== undefined ? layerEdit.size : layer.size,
      style: layerEdit.style !== undefined
        ? { ...layer.style, ...layerEdit.style }
        : layer.style,
    };
  }, [edits]);

  // Calculate container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();

    // Use ResizeObserver for more accurate size tracking
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Handle text edit completion
  const handleEditComplete = useCallback((layerId: string, newContent: string) => {
    setEditingLayerId(null);
    onTextLayerUpdate?.(layerId, newContent);
  }, [onTextLayerUpdate]);

  // Handle start editing (double-click)
  const handleStartEdit = useCallback((layerId: string) => {
    if (editable) {
      setEditingLayerId(layerId);
    }
  }, [editable]);

  // Handle layer selection (single click)
  const handleLayerClick = useCallback((layerId: string) => {
    if (editable && !editingLayerId) {
      onLayerSelect?.(layerId);
    }
  }, [editable, editingLayerId, onLayerSelect]);

  // Handle position update (drag & drop)
  const handlePositionUpdate = useCallback((layerId: string, position: { x: number; y: number }) => {
    onTextLayerPositionUpdate?.(layerId, position);
  }, [onTextLayerPositionUpdate]);

  // Handle size update (resize)
  const handleSizeUpdate = useCallback((layerId: string, size: { width: number; height: number }) => {
    onTextLayerSizeUpdate?.(layerId, size);
  }, [onTextLayerSizeUpdate]);

  // Handle click on background (deselect)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container, not on a layer
    if (e.target === e.currentTarget) {
      onLayerSelect?.(null);
    }
  }, [onLayerSelect]);

  // Count edits
  const editCount = edits?.layerUpdates.size || 0;
  const newLayerCount = newLayers?.length || 0;

  const imageSrc = `data:${page.mimeType};base64,${page.base64}`;

  return (
    <motion.section
      className="paper-card template-card rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.6, index * 0.08) }}
    >
      {/* Page header tab */}
      <div className="template-tab px-6 py-3">
        <h2 className="font-body font-medium flex items-center gap-2">
          <Feather className="w-5 h-5" />
          {page.label}
          <span className="ml-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            <Layers className="w-3 h-3" />
            レイヤー
          </span>
        </h2>
      </div>

      {/* Page content */}
      <div className="bg-paper-50">
        <div
          ref={containerRef}
          className="relative aspect-[210/297] w-full"
        >
          {/* Background image (no text) */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt={`${page.label} 背景`}
            className="w-full h-full object-contain"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImageNaturalSize({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }}
          />

          {/* Text layers overlay - positioned to match actual image display area */}
          {imageDisplayArea.width > 0 && (
            <div
              className="absolute"
              onClick={handleBackgroundClick}
              style={{
                left: imageDisplayArea.offsetX,
                top: imageDisplayArea.offsetY,
                width: imageDisplayArea.width,
                height: imageDisplayArea.height,
              }}
            >
              <AnimatePresence>
                {allLayers.map((layer, idx) => {
                  const currentLayer = getLayerWithEdits(layer);
                  const isSelected = selectedLayerId === layer.id;
                  return (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <TextLayerRenderer
                        layer={currentLayer}
                        containerWidth={imageDisplayArea.width}
                        containerHeight={imageDisplayArea.height}
                        isEditing={editingLayerId === layer.id}
                        isSelected={isSelected}
                        onStartEdit={() => handleStartEdit(layer.id)}
                        onEndEdit={(newContent) => handleEditComplete(layer.id, newContent)}
                        onClick={() => handleLayerClick(layer.id)}
                        onPositionChange={(position) => handlePositionUpdate(layer.id, position)}
                        onSizeChange={(size) => handleSizeUpdate(layer.id, size)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Page info */}
      <div className="px-6 py-3 bg-paper-100 border-t border-paper-200">
        <p className="text-xs text-ink-soft">
          {allLayers.length}個のテキストレイヤー
          {newLayerCount > 0 && ` (追加: ${newLayerCount})`}
          {editCount > 0 && ` • ${editCount}件の編集`}
        </p>
      </div>
    </motion.section>
  );
}
