"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Feather, Loader2 } from "lucide-react";
import type { TripDesignPage } from "@/types/trip";
import type { QuickEditLayer } from "@/lib/overlays/quickEdit";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { getFontCss } from "@/components/editor/EditPanel";

interface QuickEditOverlayProps {
  page: TripDesignPage;
  tripTitle: string;
  index: number;
  coverClass: string;
  layers: QuickEditLayer[];
  isRegenerating: boolean;
  onUpdateLayer: (id: string, text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function QuickEditOverlay({
  page,
  tripTitle,
  index,
  coverClass,
  layers,
  isRegenerating,
  onUpdateLayer,
  onCancel,
  onConfirm,
}: QuickEditOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const hasChanges = useMemo(
    () => layers.some((layer) => layer.editedText !== layer.originalText),
    [layers],
  );

  const handleStartEdit = (layerId: string, editable: boolean) => {
    if (!editable || isRegenerating) return;
    setEditingLayerId(layerId);
  };

  const handleEndEdit = () => {
    setEditingLayerId(null);
  };

  return (
    <motion.section
      className={`paper-card template-card rounded-xl overflow-hidden ${
        index === 0 ? "template-cover" : ""
      } ${index === 0 ? coverClass : ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.6, index * 0.08) }}
    >
      <div className="template-tab px-6 py-3 flex items-center gap-3">
        <h2 className="font-body font-medium flex items-center gap-2">
          <Feather className="w-5 h-5" />
          {page.label}
        </h2>
        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
          仮プレビュー中
        </span>
      </div>

      <div className="bg-paper-50">
        <div ref={containerRef} className="relative aspect-[210/297] w-full">
          <ImageWithFallback
            src={`data:${page.mimeType};base64,${page.base64}`}
            alt={`${tripTitle} ${page.label}`}
            className="w-full h-full object-contain"
          />

          {containerSize.width > 0 && (
            <div className="absolute inset-0">
              {layers.map((layer) => {
                const { textLayer } = layer;
                const pixelPosition = {
                  x: textLayer.position.x * containerSize.width,
                  y: textLayer.position.y * containerSize.height,
                };
                const pixelSize = {
                  width: textLayer.size.width * containerSize.width,
                  height: textLayer.size.height * containerSize.height,
                };
                const scaledFontSize = Math.max(
                  8,
                  textLayer.style.fontSize * (containerSize.width / 595),
                );
                const isEditing = editingLayerId === layer.id;
                const isChanged = layer.editedText !== layer.originalText;

                return (
                  <div
                    key={layer.id}
                    className={`absolute ${layer.editable ? "cursor-text" : "cursor-not-allowed opacity-60"}`}
                    style={{
                      left: pixelPosition.x,
                      top: pixelPosition.y,
                      width: pixelSize.width,
                      minHeight: pixelSize.height,
                    }}
                    onClick={() => handleStartEdit(layer.id, layer.editable)}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={layer.editedText}
                        onChange={(e) => onUpdateLayer(layer.id, e.target.value)}
                        onBlur={handleEndEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleEndEdit();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            handleEndEdit();
                          }
                        }}
                        className="w-full h-full p-2 border-2 border-accent-sky rounded resize-none bg-white/95 shadow"
                        style={{
                          fontSize: scaledFontSize,
                          fontFamily: getFontCss(textLayer.style.fontFamily),
                          fontWeight: textLayer.style.fontWeight,
                          color: textLayer.style.color,
                          lineHeight: textLayer.style.lineHeight,
                          letterSpacing: textLayer.style.letterSpacing,
                          textAlign: textLayer.style.alignment,
                        }}
                      />
                    ) : (
                      <div
                        className={`relative w-full h-full rounded ${isChanged ? "ring-2 ring-amber-400" : "ring-1 ring-paper-200"} hover:ring-2 hover:ring-accent-sky`}
                        style={{
                          fontSize: scaledFontSize,
                          fontFamily: getFontCss(textLayer.style.fontFamily),
                          fontWeight: textLayer.style.fontWeight,
                          color: textLayer.style.color,
                          lineHeight: textLayer.style.lineHeight,
                          letterSpacing: textLayer.style.letterSpacing,
                          textAlign: textLayer.style.alignment,
                          backgroundColor: textLayer.style.backgroundColor,
                          padding: textLayer.style.padding,
                          borderRadius: textLayer.style.borderRadius,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {layer.editedText || "(クリックして編集)"}
                        {isChanged && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isRegenerating && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>再生成中...</p>
                <p className="text-sm opacity-75">約40秒</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-paper-200 bg-white/80 px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm text-ink-soft">
          {hasChanges ? (
            <span className="text-amber-600">● 変更あり</span>
          ) : (
            <span>テキストをクリックして編集</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isRegenerating}
            className="px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-100 rounded-lg disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasChanges || isRegenerating}
            className={`px-4 py-1.5 text-sm rounded-lg ${
              hasChanges
                ? "bg-accent-sky text-white hover:bg-accent-leaf"
                : "bg-paper-200 text-paper-400 cursor-not-allowed"
            } disabled:opacity-50`}
          >
            {isRegenerating ? "再生成中..." : "確定して再生成"}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
