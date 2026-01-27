"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Feather, Layers, Edit3, Plus } from "lucide-react";
import type { TripDesignPage, TextLayer, TextLayerStyle } from "@/types/trip";
import { TextLayerRenderer } from "./TextLayerRenderer";

// Edit tracking for a single layer
interface LayerEdit {
  content?: string;
  style?: Partial<TextLayerStyle>;
  position?: { x: number; y: number };
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
  onLayerSelect?: (layerId: string | null) => void;
  onAddLayer?: (layer: TextLayer) => void;
  selectedLayerId?: string | null;
}

export function LayeredPage(props: LayeredPageProps) {
  const {
    page,
    index,
    editable,
    edits,
    newLayers,
    onTextLayerUpdate,
    onTextLayerStyleUpdate,
    onTextLayerPositionUpdate,
    onLayerSelect,
    onAddLayer,
    selectedLayerId,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [showLayerHints, setShowLayerHints] = useState(true);

  // Get text layers from page including new user-added layers
  const allLayers = useMemo(() => {
    const baseLayers = page.textLayers || [];
    const addedLayers = newLayers || [];
    return [...baseLayers, ...addedLayers];
  }, [page.textLayers, newLayers]);

  // Get current layer state with all edits applied (content, style, position)
  const getLayerWithEdits = useCallback((layer: TextLayer): TextLayer => {
    const layerEdit = edits?.layerUpdates.get(layer.id);
    if (!layerEdit) {
      return layer;
    }

    return {
      ...layer,
      content: layerEdit.content !== undefined ? layerEdit.content : layer.content,
      position: layerEdit.position !== undefined ? layerEdit.position : layer.position,
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

  // Handle click on background (deselect)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the container, not on a layer
    if (e.target === e.currentTarget) {
      onLayerSelect?.(null);
    }
  }, [onLayerSelect]);

  // Generate unique ID for new layer
  const generateLayerId = useCallback(() => {
    return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Handle add new text layer
  const handleAddLayer = useCallback(() => {
    if (!onAddLayer) return;

    const newLayer: TextLayer = {
      id: generateLayerId(),
      zoneType: "body",
      content: "新しいテキスト",
      position: { x: 0.1, y: 0.5 },
      size: { width: 0.8, height: 0.1 },
      style: {
        fontSize: 14,
        fontFamily: "Zen Kaku Gothic New",
        fontWeight: 400,
        color: "#333333",
        alignment: "left",
        lineHeight: 1.6,
      },
      isUserAdded: true,
    };

    onAddLayer(newLayer);
  }, [onAddLayer, generateLayerId]);

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
        <div className="flex items-center justify-between">
          <h2 className="font-body font-medium flex items-center gap-2">
            <Feather className="w-5 h-5" />
            {page.label}
            <span className="ml-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              <Layers className="w-3 h-3" />
              レイヤー
            </span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Layer hints toggle */}
            {editable && (
              <button
                onClick={() => setShowLayerHints(!showLayerHints)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  showLayerHints
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-ink-soft hover:bg-paper-100"
                }`}
                title={showLayerHints ? "編集ヒントを非表示" : "編集ヒントを表示"}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {showLayerHints ? "ヒント ON" : "ヒント OFF"}
              </button>
            )}

            {/* Add text button */}
            {editable && onAddLayer && (
              <button
                onClick={handleAddLayer}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors text-green-600 bg-green-50 hover:bg-green-100"
                title="テキストを追加"
              >
                <Plus className="w-3.5 h-3.5" />
                テキスト追加
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="bg-paper-50">
        <div
          ref={containerRef}
          className="relative aspect-[210/297] w-full"
        >
          {/* Background image (no text) */}
          <img
            src={imageSrc}
            alt={`${page.label} 背景`}
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Text layers overlay */}
          {containerSize.width > 0 && (
            <div
              className="absolute inset-0"
              onClick={handleBackgroundClick}
              style={{
                // Allow pointer events for deselection
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
                        containerWidth={containerSize.width}
                        containerHeight={containerSize.height}
                        isEditing={editingLayerId === layer.id}
                        isSelected={isSelected}
                        onStartEdit={() => handleStartEdit(layer.id)}
                        onEndEdit={(newContent) => handleEditComplete(layer.id, newContent)}
                        onClick={() => handleLayerClick(layer.id)}
                        onPositionChange={(position) => handlePositionUpdate(layer.id, position)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Edit mode hint overlay */}
              {editable && showLayerHints && allLayers.length > 0 && !editingLayerId && !selectedLayerId && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                    クリックで選択・ドラッグで移動・ダブルクリックで編集
                  </div>
                </div>
              )}
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
