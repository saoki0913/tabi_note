"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Save, Loader2, Feather, Download, RefreshCw, Wand2, Layers, X } from "lucide-react";
import type { Trip, TripDesignPage, TextLayer, TextLayerStyle, DesignRenderMode } from "@/types/trip";
import type { AnalysisResult } from "@/lib/analysis/types";
import { PageRenderer } from "./PageRenderer";
import { usePageEditor } from "./hooks/usePageEditor";
import { ExportDialog } from "@/components/ExportDialog";
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
  onRegenerate?: (renderMode: DesignRenderMode) => Promise<void>;
}

export function DesignEditor({ trip, onSave, onBack, onRegenerate }: DesignEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState<DesignRenderMode>(
    trip.design?.renderMode ?? "full"
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Layered page edits (content, style, and position updates)
  const [layeredEdits, setLayeredEdits] = useState<LayeredPageEdits>(new Map());

  // New layers added by user
  const [newLayers, setNewLayers] = useState<NewLayersMap>(new Map());

  // Currently selected layer (for style editing)
  const [selectedLayer, setSelectedLayer] = useState<{ pageId: string; layerId: string } | null>(null);

  // Page editor state management (for legacy OCR-based pages)
  const {
    pageEdits,
    updatePageText,
    getEditedRegions,
    hasChanges: hasLegacyChanges,
    clearAllEdits,
    setAnalysisCache,
  } = usePageEditor();

  // Check if there are layered edits
  const hasLayeredChanges = useMemo(() => {
    let hasEdits = false;
    layeredEdits.forEach((edits) => {
      if (edits.size > 0) hasEdits = true;
    });
    newLayers.forEach((layers) => {
      if (layers.length > 0) hasEdits = true;
    });
    return hasEdits;
  }, [layeredEdits, newLayers]);

  // Combined changes check
  const hasChanges = hasLegacyChanges || hasLayeredChanges;

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

  // Handle analysis completion - cache the results for saving
  const handleAnalysisComplete = useCallback((pageId: string, result: AnalysisResult) => {
    setAnalysisCache(pageId, {
      textRegions: result.textRegions.map(r => ({
        id: r.id,
        bounds: r.bounds,
        content: r.content,
        style: r.style,
      })),
    });
  }, [setAnalysisCache]);

  // Auto-hide save message
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Save handler - composite edited text onto images (legacy) or update textLayers (layered)
  const handleSave = useCallback(async () => {
    if (isSaving || !onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      // Create updated pages
      const updatedPages: TripDesignPage[] = await Promise.all(
        sortedPages.map(async (page) => {
          // Handle layered pages
          if (page.renderType === "layered" && page.textLayers) {
            const pageLayerEdits = layeredEdits.get(page.id);
            const pageNewLayers = newLayers.get(page.id) || [];
            const hasEditsForPage = (pageLayerEdits && pageLayerEdits.size > 0) || pageNewLayers.length > 0;

            // If no edits for this layered page, return as is
            if (!hasEditsForPage) {
              return page;
            }

            // Update text layers with edited content, style, and position
            const updatedTextLayers: TextLayer[] = page.textLayers.map(layer => {
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
          }

          // Handle legacy OCR-based pages
          const editedRegions = getEditedRegions(page.id);

          // If no edits for this page, return as is
          if (editedRegions.length === 0) {
            return page;
          }

          // Composite edited text onto the image
          const compositedBase64 = await compositeTextOnImage(
            page.base64,
            page.mimeType,
            editedRegions
          );

          return {
            ...page,
            base64: compositedBase64,
            isEdited: true,
            createdAt: new Date().toISOString(),
          };
        })
      );

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
      clearAllEdits();
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
  }, [isSaving, onSave, hasChanges, sortedPages, trip, getEditedRegions, clearAllEdits, layeredEdits, newLayers]);

  // Open export dialog
  const handleOpenExportDialog = useCallback(() => {
    setIsExportDialogOpen(true);
  }, []);

  // Open regenerate dialog
  const handleOpenRegenerateDialog = useCallback(() => {
    if (!onRegenerate) return;
    setRegenerateMode(trip.design?.renderMode ?? "full");
    setIsRegenerateDialogOpen(true);
  }, [onRegenerate, trip.design?.renderMode]);

  // Execute regeneration
  const handleConfirmRegenerate = useCallback(async () => {
    if (isRegenerating || !onRegenerate) return;

    setIsRegenerateDialogOpen(false);
    setIsRegenerating(true);
    try {
      await onRegenerate(regenerateMode);
      // Clear all edits after regeneration
      clearAllEdits();
      setLayeredEdits(new Map());
      setNewLayers(new Map());
      setSelectedLayer(null);
    } catch (err) {
      console.error("Regeneration failed:", err);
      setSaveMessage("再生成に失敗しました");
    } finally {
      setIsRegenerating(false);
    }
  }, [isRegenerating, onRegenerate, regenerateMode, clearAllEdits]);

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

              {/* Regenerate button */}
              {onRegenerate && (
                <motion.button
                  onClick={handleOpenRegenerateDialog}
                  disabled={isRegenerating}
                  className="flex items-center gap-2 px-4 py-2 btn btn-soft btn-pill text-sm disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                  {isRegenerating ? "再生成中..." : "再生成"}
                </motion.button>
              )}

              {/* Export button */}
              <motion.button
                onClick={handleOpenExportDialog}
                className="flex items-center gap-2 px-4 py-2 btn btn-soft btn-pill text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                書き出し
              </motion.button>

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
                      textEdits: pageEdits.get(page.id)?.textEdits,
                      layerEdits: pageLayerEdits ? { layerUpdates: pageLayerEdits } : undefined,
                      newLayers: pageNewLayers,
                    }}
                    // Legacy callbacks
                    onTextUpdate={(regionId, newContent) =>
                      updatePageText(page.id, regionId, newContent)
                    }
                    onAnalysisComplete={handleAnalysisComplete}
                    // Layered callbacks
                    onTextLayerUpdate={(layerId, newContent) =>
                      updateTextLayerContent(page.id, layerId, newContent)
                    }
                    onTextLayerStyleUpdate={(layerId, style) =>
                      updateTextLayerStyle(page.id, layerId, style)
                    }
                    onTextLayerPositionUpdate={(layerId, position) =>
                      updateTextLayerPosition(page.id, layerId, position)
                    }
                    onLayerSelect={(layerId) =>
                      handleLayerSelect(page.id, layerId)
                    }
                    onAddLayer={(layer) =>
                      addTextLayer(page.id, layer)
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

      {/* Regenerate Dialog */}
      <AnimatePresence>
        {isRegenerateDialogOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRegenerateDialogOpen(false)}
          >
            <motion.div
              className="paper-card rounded-2xl p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl text-ink">デザイン再生成</h3>
                <button
                  onClick={() => setIsRegenerateDialogOpen(false)}
                  className="p-1 rounded-full hover:bg-paper-200 transition-colors"
                >
                  <X className="w-5 h-5 text-ink-soft" />
                </button>
              </div>

              <p className="text-sm text-ink-soft mb-4">
                現在の編集内容は失われます。生成方式を選択してください。
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setRegenerateMode("full")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    regenerateMode === "full"
                      ? "border-accent-coral bg-accent-coral/5"
                      : "border-paper-200 hover:border-paper-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      regenerateMode === "full"
                        ? "bg-gradient-to-br from-accent-coral to-accent-sun"
                        : "bg-paper-200"
                    }`}>
                      <Wand2 className={`w-5 h-5 ${regenerateMode === "full" ? "text-white" : "text-ink-soft"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-ui font-medium text-ink">一発生成</span>
                        <span className="text-xs text-accent-coral font-ui">推奨</span>
                      </div>
                      <p className="text-xs text-ink-soft">AIが文字を含む完全な画像を生成</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setRegenerateMode("layered")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    regenerateMode === "layered"
                      ? "border-accent-sky bg-accent-sky/5"
                      : "border-paper-200 hover:border-paper-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      regenerateMode === "layered"
                        ? "bg-gradient-to-br from-accent-sky to-accent-leaf"
                        : "bg-paper-200"
                    }`}>
                      <Layers className={`w-5 h-5 ${regenerateMode === "layered" ? "text-white" : "text-ink-soft"}`} />
                    </div>
                    <div>
                      <span className="font-ui font-medium text-ink">編集可能モード</span>
                      <p className="text-xs text-ink-soft">背景のみ生成、文字は編集可能</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsRegenerateDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 btn btn-ghost text-sm"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmRegenerate}
                  className="flex-1 px-4 py-2.5 btn btn-primary text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  再生成する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Dialog */}
      <ExportDialog
        trip={trip}
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
}

// Helper type for edited region
interface EditedRegion {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  content: string;
  style: {
    fontSize: number;
    fontWeight: number;
    color: string;
    alignment: "left" | "center" | "right";
  };
}

// Composite text onto image using Canvas
async function compositeTextOnImage(
  imageBase64: string,
  mimeType: string,
  editedRegions: EditedRegion[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw edited text regions
      for (const region of editedRegions) {
        const { bounds, content, style } = region;

        // Fill background to cover original text
        // Use a slightly larger area to ensure coverage
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);

        // Set text style
        ctx.font = `${style.fontWeight} ${style.fontSize}px "Zen Kaku Gothic New", sans-serif`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = "top";

        // Handle text alignment
        let textX = bounds.x;
        if (style.alignment === "center") {
          ctx.textAlign = "center";
          textX = bounds.x + bounds.width / 2;
        } else if (style.alignment === "right") {
          ctx.textAlign = "right";
          textX = bounds.x + bounds.width;
        } else {
          ctx.textAlign = "left";
        }

        // Handle multi-line text
        const lines = content.split("\n");
        const lineHeight = style.fontSize * 1.4;
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, textX, bounds.y + lineIndex * lineHeight);
        });
      }

      // Export as base64
      const dataUrl = canvas.toDataURL(mimeType);
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = `data:${mimeType};base64,${imageBase64}`;
  });
}
