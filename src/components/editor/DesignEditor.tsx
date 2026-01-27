"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Save, Loader2, Feather, Download } from "lucide-react";
import type { Trip, TripDesignPage } from "@/types/trip";
import type { AnalysisResult } from "@/lib/analysis/types";
import { EditablePage } from "./EditablePage";
import { usePageEditor } from "./hooks/usePageEditor";

interface DesignEditorProps {
  trip: Trip;
  onSave?: (trip: Trip) => void;
  onBack?: () => void;
}

export function DesignEditor({ trip, onSave, onBack }: DesignEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Page editor state management
  const {
    pageEdits,
    updatePageText,
    getEditedRegions,
    hasChanges,
    clearAllEdits,
    setAnalysisCache,
  } = usePageEditor();

  // Get sorted pages
  const sortedPages = useMemo(() => {
    return trip.design?.pages?.length
      ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
      : [];
  }, [trip.design?.pages]);

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

  // Save handler - composite edited text onto images
  const handleSave = useCallback(async () => {
    if (isSaving || !onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      // Create updated pages with composited images
      const updatedPages: TripDesignPage[] = await Promise.all(
        sortedPages.map(async (page) => {
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
      setSaveMessage("保存しました");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveMessage("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave, hasChanges, sortedPages, trip, getEditedRegions, clearAllEdits]);

  // Export all pages as images
  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      for (const page of sortedPages) {
        const editedRegions = getEditedRegions(page.id);
        let base64 = page.base64;

        // If there are edits, composite them
        if (editedRegions.length > 0) {
          base64 = await compositeTextOnImage(page.base64, page.mimeType, editedRegions);
        }

        // Create download link
        const link = document.createElement("a");
        link.download = `${trip.title || "shiori"}_${page.label}.png`;
        link.href = `data:${page.mimeType};base64,${base64}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      setSaveMessage("書き出しが完了しました");
    } catch (err) {
      console.error("Export failed:", err);
      setSaveMessage("書き出しに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, sortedPages, trip.title, getEditedRegions]);

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

              {/* Export button */}
              <motion.button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 btn btn-soft btn-pill text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
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

      {/* Page list */}
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="space-y-8">
          {sortedPages.map((page, index) => (
            <EditablePage
              key={page.id}
              page={page}
              index={index}
              edits={pageEdits.get(page.id)}
              onTextUpdate={(regionId, newContent) =>
                updatePageText(page.id, regionId, newContent)
              }
              onAnalysisComplete={handleAnalysisComplete}
            />
          ))}
        </div>
      </main>
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
