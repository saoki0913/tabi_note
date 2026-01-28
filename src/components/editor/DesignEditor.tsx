"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Save, Loader2, Feather } from "lucide-react";
import type { Trip, TripDesignPage, TextLayer, TextLayerStyle } from "@/types/trip";
import { PageRenderer } from "./PageRenderer";
import { EditPanel } from "./EditPanel";

// Edit tracking for layered pages
interface LayerEdit {
  content?: string;
  style?: Partial<TextLayerStyle>;
  position?: { x: number; y: number };
}

// Map of pageId -> layerId -> edits
type LayeredPageEdits = Map<string, Map<string, LayerEdit>>;

// Map of pageId -> new layers to add
type NewLayersMap = Map<string, TextLayer[]>;

interface DesignEditorProps {
  trip: Trip;
  onSave?: (trip: Trip) => void;
  onBack?: () => void;
}

export function DesignEditor({ trip, onSave, onBack }: DesignEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Layered page edits (content, style, and position updates)
  const [layeredEdits, setLayeredEdits] = useState<LayeredPageEdits>(new Map());

  // New layers added by user
  const [newLayers, setNewLayers] = useState<NewLayersMap>(new Map());

  // Currently selected layer (for style editing)
  const [selectedLayer, setSelectedLayer] = useState<{ pageId: string; layerId: string } | null>(null);

  // Check if there are layered edits
  const hasChanges = useMemo(() => {
    let hasEdits = false;
    layeredEdits.forEach((edits) => {
      if (edits.size > 0) hasEdits = true;
    });
    newLayers.forEach((layers) => {
      if (layers.length > 0) hasEdits = true;
    });
    return hasEdits;
  }, [layeredEdits, newLayers]);

  // Update text layer content for layered pages
  const updateTextLayerContent = useCallback((pageId: string, layerId: string, newContent: string) => {
    setLayeredEdits(prev => {
      const newEdits = new Map(prev);
      const pageLayerEdits = new Map(newEdits.get(pageId) || new Map());
      const existingEdit = pageLayerEdits.get(layerId) || {};
      pageLayerEdits.set(layerId, { ...existingEdit, content: newContent });
      newEdits.set(pageId, pageLayerEdits);
      return newEdits;
    });
  }, []);

  // Update text layer style for layered pages
  const updateTextLayerStyle = useCallback((pageId: string, layerId: string, styleUpdates: Partial<TextLayerStyle>) => {
    setLayeredEdits(prev => {
      const newEdits = new Map(prev);
      const pageLayerEdits = new Map(newEdits.get(pageId) || new Map());
      const existingEdit = pageLayerEdits.get(layerId) || {};
      const existingStyle = existingEdit.style || {};
      pageLayerEdits.set(layerId, {
        ...existingEdit,
        style: { ...existingStyle, ...styleUpdates }
      });
      newEdits.set(pageId, pageLayerEdits);
      return newEdits;
    });
  }, []);

  // Update text layer position for layered pages
  const updateTextLayerPosition = useCallback((pageId: string, layerId: string, position: { x: number; y: number }) => {
    setLayeredEdits(prev => {
      const newEdits = new Map(prev);
      const pageLayerEdits = new Map(newEdits.get(pageId) || new Map());
      const existingEdit = pageLayerEdits.get(layerId) || {};
      pageLayerEdits.set(layerId, { ...existingEdit, position });
      newEdits.set(pageId, pageLayerEdits);
      return newEdits;
    });
  }, []);

  // Update text layer size for layered pages
  const updateTextLayerSize = useCallback((pageId: string, layerId: string, size: { width: number; height: number }) => {
    setLayeredEdits(prev => {
      const newEdits = new Map(prev);
      const pageLayerEdits = new Map(newEdits.get(pageId) || new Map());
      const existingEdit = pageLayerEdits.get(layerId) || {};
      pageLayerEdits.set(layerId, { ...existingEdit, size });
      newEdits.set(pageId, pageLayerEdits);
      return newEdits;
    });
  }, []);

  // Add new text layer to a page
  const addTextLayer = useCallback((pageId: string, layer: TextLayer) => {
    setNewLayers(prev => {
      const updated = new Map(prev);
      const existingLayers = updated.get(pageId) || [];
      updated.set(pageId, [...existingLayers, { ...layer, isUserAdded: true }]);
      return updated;
    });
  }, []);

  // Handle layer selection
  const handleLayerSelect = useCallback((pageId: string, layerId: string | null) => {
    if (layerId === null) {
      setSelectedLayer(null);
    } else {
      setSelectedLayer({ pageId, layerId });
    }
  }, []);

  // Get sorted pages
  const sortedPages = useMemo(() => {
    return trip.design?.pages?.length
      ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
      : [];
  }, [trip.design?.pages]);

  // Check if editable (layered mode only)
  const isEditable = useMemo(() => {
    return trip.design?.renderMode === "layered";
  }, [trip.design?.renderMode]);

  // Get selected layer object
  const selectedLayerObject = useMemo((): TextLayer | null => {
    if (!selectedLayer) return null;
    const page = sortedPages.find(p => p.id === selectedLayer.pageId);
    if (!page?.textLayers) return null;

    // Check in existing layers
    const existingLayer = page.textLayers.find(l => l.id === selectedLayer.layerId);
    if (existingLayer) {
      // Apply edits if any
      const pageLayerEdits = layeredEdits.get(selectedLayer.pageId);
      const layerEdit = pageLayerEdits?.get(selectedLayer.layerId);
      if (layerEdit) {
        return {
          ...existingLayer,
          content: layerEdit.content ?? existingLayer.content,
          position: layerEdit.position ?? existingLayer.position,
          style: layerEdit.style
            ? { ...existingLayer.style, ...layerEdit.style }
            : existingLayer.style,
        };
      }
      return existingLayer;
    }

    // Check in new layers
    const pageNewLayers = newLayers.get(selectedLayer.pageId);
    const newLayer = pageNewLayers?.find(l => l.id === selectedLayer.layerId);
    return newLayer ?? null;
  }, [selectedLayer, sortedPages, layeredEdits, newLayers]);

  // Get edits for selected layer
  const selectedLayerEdits = useMemo(() => {
    if (!selectedLayer) return undefined;
    const pageLayerEdits = layeredEdits.get(selectedLayer.pageId);
    const layerEdit = pageLayerEdits?.get(selectedLayer.layerId);
    return layerEdit;
  }, [selectedLayer, layeredEdits]);

  // Auto-hide save message
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Save handler - update textLayers
  const handleSave = useCallback(async () => {
    if (isSaving || !onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      // Create updated pages
      const updatedPages: TripDesignPage[] = sortedPages.map((page) => {
        const pageLayerEdits = layeredEdits.get(page.id);
        const pageNewLayers = newLayers.get(page.id) || [];
        const hasEditsForPage = (pageLayerEdits && pageLayerEdits.size > 0) || pageNewLayers.length > 0;

        // If no edits for this page, return as is
        if (!hasEditsForPage) {
          return page;
        }

        // Update text layers with edited content, style, and position
        const updatedTextLayers: TextLayer[] = (page.textLayers || []).map(layer => {
          const layerEdit = pageLayerEdits?.get(layer.id);
          if (!layerEdit) {
            return layer;
          }

          // Merge all edits
          return {
            ...layer,
            content: layerEdit.content !== undefined ? layerEdit.content : layer.content,
            position: layerEdit.position !== undefined ? layerEdit.position : layer.position,
            style: layerEdit.style !== undefined
              ? { ...layer.style, ...layerEdit.style }
              : layer.style,
          };
        });

        // Add new user-created layers
        const allLayers = [...updatedTextLayers, ...pageNewLayers];

        return {
          ...page,
          textLayers: allLayers,
          isEdited: true,
          createdAt: new Date().toISOString(),
        };
      });

      // Create updated trip
      const updatedTrip: Trip = {
        ...trip,
        design: {
          ...trip.design!,
          pages: updatedPages,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      // Call onSave callback
      onSave(updatedTrip);
      setLayeredEdits(new Map()); // Clear layered edits
      setNewLayers(new Map()); // Clear new layers
      setSelectedLayer(null); // Clear selection
      setSaveMessage("保存しました");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveMessage("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave, hasChanges, sortedPages, trip, layeredEdits, newLayers]);

  if (!sortedPages.length) {
    return (
      <div className="min-h-screen ink-wash flex items-center justify-center">
        <div className="paper-card rounded-xl p-8 text-center">
          <Feather className="w-12 h-12 mx-auto mb-4 text-ink-soft" />
          <p className="text-ink">デザインがまだ生成されていません</p>
          <button
            onClick={onBack}
            className="mt-4 btn btn-primary btn-pill px-6 py-2"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ink-wash">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-paper-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-ink-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-body">戻る</span>
            </button>

            <h1 className="font-display text-xl text-ink">
              デザイン編集
            </h1>

            <div className="flex items-center gap-3">
              {/* Save message */}
              <AnimatePresence>
                {saveMessage && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-sm text-ink-soft"
                  >
                    {saveMessage}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Save button */}
              {onSave && (
                <motion.button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="flex items-center gap-2 px-5 py-2 btn btn-primary btn-pill text-sm disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "保存中..." : "保存"}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2-column layout: Pages on left, Edit panel on right */}
      <main className="h-[calc(100vh-73px)] overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr,380px]">
          {/* Left: Page list (scrollable) */}
          <div className="h-full overflow-y-auto px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-8">
              {sortedPages.map((page, index) => {
                const pageLayerEdits = layeredEdits.get(page.id);
                const pageNewLayers = newLayers.get(page.id);
                const isPageSelected = selectedLayer?.pageId === page.id;

                return (
                  <PageRenderer
                    key={page.id}
                    page={page}
                    index={index}
                    edits={{
                      layerEdits: pageLayerEdits ? { layerUpdates: pageLayerEdits } : undefined,
                      newLayers: pageNewLayers,
                    }}
                    onTextLayerUpdate={(layerId, newContent) =>
                      updateTextLayerContent(page.id, layerId, newContent)
                    }
                    onTextLayerStyleUpdate={(layerId, style) =>
                      updateTextLayerStyle(page.id, layerId, style)
                    }
                    onTextLayerPositionUpdate={(layerId, position) =>
                      updateTextLayerPosition(page.id, layerId, position)
                    }
                    onTextLayerSizeUpdate={(layerId, size) =>
                      updateTextLayerSize(page.id, layerId, size)
                    }
                    onLayerSelect={(layerId) =>
                      handleLayerSelect(page.id, layerId)
                    }
                    selectedLayerId={isPageSelected ? selectedLayer.layerId : null}
                  />
                );
              })}
            </div>
          </div>

          {/* Right: Edit panel (sticky) */}
          <div className="hidden lg:block h-full overflow-hidden">
            <EditPanel
              selectedLayer={selectedLayerObject}
              layerEdits={selectedLayerEdits}
              isEditable={isEditable}
              onTextChange={(content) => {
                if (selectedLayer) {
                  updateTextLayerContent(selectedLayer.pageId, selectedLayer.layerId, content);
                }
              }}
              onStyleChange={(style) => {
                if (selectedLayer) {
                  updateTextLayerStyle(selectedLayer.pageId, selectedLayer.layerId, style);
                }
              }}
              onAddLayer={(layer) => {
                // Add to the first page or selected page
                const targetPageId = selectedLayer?.pageId ?? sortedPages[0]?.id;
                if (targetPageId) {
                  addTextLayer(targetPageId, layer);
                  // Select the new layer
                  handleLayerSelect(targetPageId, layer.id);
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
