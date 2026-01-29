"use client";

import type { CSSProperties } from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Feather, Layers } from "lucide-react";
import type { Trip, TripDesignPage, TextLayer } from "../types/trip";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getFontCss } from "./editor/EditPanel";
import type { QuickEditLayer } from "@/lib/overlays/quickEdit";
import { QuickEditOverlay } from "./preview/QuickEditOverlay";

interface PreviewProps {
  trip: Trip;
  quickEdit?: {
    activePageId: string | null;
    layers: QuickEditLayer[];
    regeneratingPageId: string | null;
    onStartEdit: (pageId: string) => void;
    onUpdateLayer: (layerId: string, text: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
  };
}

// Read-only text layer display component for preview
function PreviewTextLayer({
  layer,
  containerWidth,
  containerHeight,
}: {
  layer: TextLayer;
  containerWidth: number;
  containerHeight: number;
}) {
  // Convert normalized coordinates to pixel values
  const pixelPosition = useMemo(() => ({
    x: layer.position.x * containerWidth,
    y: layer.position.y * containerHeight,
  }), [layer.position, containerWidth, containerHeight]);

  const pixelSize = useMemo(() => ({
    width: layer.size.width * containerWidth,
    height: layer.size.height * containerHeight,
  }), [layer.size, containerWidth, containerHeight]);

  // Scale font size based on container
  const scaledFontSize = useMemo(() => {
    const baseCanvasWidth = 595;
    const scale = containerWidth / baseCanvasWidth;
    return Math.max(8, layer.style.fontSize * scale);
  }, [layer.style.fontSize, containerWidth]);

  return (
    <div
      style={{
        position: "absolute",
        left: pixelPosition.x,
        top: pixelPosition.y,
        width: pixelSize.width,
        minHeight: pixelSize.height,
        opacity: layer.opacity ?? 1,
        transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
        padding: layer.style.padding || 0,
        borderRadius: layer.style.borderRadius || 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: scaledFontSize,
          fontFamily: getFontCss(layer.style.fontFamily),
          fontWeight: layer.style.fontWeight,
          color: layer.style.color,
          textAlign: layer.style.alignment,
          lineHeight: layer.style.lineHeight,
          letterSpacing: layer.style.letterSpacing,
          backgroundColor: layer.style.backgroundColor,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {layer.content}
      </div>
    </div>
  );
}

// Page with text layers overlay
function PreviewPage({
  page,
  trip,
  index,
  coverClass,
  showQuickEdit,
  onQuickEdit,
}: {
  page: TripDesignPage;
  trip: Trip;
  index: number;
  coverClass: string;
  showQuickEdit?: boolean;
  onQuickEdit?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track container size for text layer positioning
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

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const hasTextLayers = page.textLayers && page.textLayers.length > 0;

  return (
    <motion.section
      className={`paper-card template-card rounded-xl overflow-hidden group ${
        index === 0 ? "template-cover" : ""
      } ${index === 0 ? coverClass : ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.6, index * 0.08) }}
    >
      <div className="template-tab px-6 py-3">
        <h2 className="font-body font-medium flex items-center gap-2">
          <Feather className="w-5 h-5" />
          {page.label}
          {hasTextLayers && (
            <span className="ml-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              <Layers className="w-3 h-3" />
              編集済み
            </span>
          )}
        </h2>
      </div>
      <div className="bg-paper-50">
        <div
          ref={containerRef}
          className="relative aspect-[210/297] w-full"
        >
          {/* Background image */}
          <ImageWithFallback
            src={`data:${page.mimeType};base64,${page.base64}`}
            alt={`${trip.title} ${page.label}`}
            className="w-full h-full object-contain"
          />

          {/* Text layers overlay (for layered mode) */}
          {hasTextLayers && containerSize.width > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                // Match image display area (object-contain centers the image)
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="relative"
                style={{
                  width: containerSize.width,
                  height: containerSize.height,
                }}
              >
                {page.textLayers!.map((layer) => (
                  <PreviewTextLayer
                    key={layer.id}
                    layer={layer}
                    containerWidth={containerSize.width}
                    containerHeight={containerSize.height}
                  />
                ))}
              </div>
            </div>
          )}

          {showQuickEdit && onQuickEdit && (
            <button
              type="button"
              onClick={onQuickEdit}
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-ink px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✏️ 編集
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export function TripPreview({ trip, quickEdit }: PreviewProps) {
  const getTemplateStyles = () => {
    switch (trip.templateType) {
      case "minimal":
        return {
          accent: "#2e3a5d",
          accentAlt: "#3f3833",
          coverClass: "cover-minimal",
        };
      case "photo":
        return {
          accent: "#4da3c7",
          accentAlt: "#7fa06a",
          coverClass: "cover-photo",
        };
      case "retro":
        return {
          accent: "#d35b6a",
          accentAlt: "#f4c44d",
          coverClass: "cover-pop",
        };
      case "romantic":
        return {
          accent: "#d35b6a",
          accentAlt: "#f4c44d",
          coverClass: "cover-pop",
        };
      case "modern":
        return {
          accent: "#2e3a5d",
          accentAlt: "#3f3833",
          coverClass: "cover-minimal",
        };
      case "nature":
        return {
          accent: "#7fa06a",
          accentAlt: "#4da3c7",
          coverClass: "cover-photo",
        };
      case "adventure":
        return {
          accent: "#2e3a5d",
          accentAlt: "#4da3c7",
          coverClass: "cover-minimal",
        };
      case "pop":
      default:
        return {
          accent: "#f26b4f",
          accentAlt: "#f4c44d",
          coverClass: "cover-pop",
        };
    }
  };

  const styles = getTemplateStyles();
  const sortedPages = trip.design?.pages?.length
    ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
    : null;
  const fullPages = sortedPages?.length ? sortedPages : null;

  const quickEditEnabled = Boolean(quickEdit) && trip.design?.renderMode === "full";
  const canStartQuickEdit =
    quickEditEnabled &&
    !quickEdit?.activePageId &&
    !quickEdit?.regeneratingPageId;

  return (
    <div
      className="space-y-6 template-root"
      style={
        {
          "--template-accent": styles.accent,
          "--template-accent-alt": styles.accentAlt,
        } as CSSProperties
      }
    >
      {fullPages ? (
        fullPages.map((page, index) => {
          const isQuickEditing =
            quickEditEnabled && quickEdit?.activePageId === page.id;
          if (isQuickEditing && quickEdit) {
            return (
              <QuickEditOverlay
                key={page.id}
                page={page}
                tripTitle={trip.title}
                index={index}
                coverClass={styles.coverClass}
                layers={quickEdit.layers}
                isRegenerating={quickEdit.regeneratingPageId === page.id}
                onUpdateLayer={quickEdit.onUpdateLayer}
                onCancel={quickEdit.onCancel}
                onConfirm={quickEdit.onConfirm}
              />
            );
          }

          return (
            <PreviewPage
              key={page.id}
              page={page}
              trip={trip}
              index={index}
              coverClass={styles.coverClass}
              showQuickEdit={canStartQuickEdit}
              onQuickEdit={
                quickEditEnabled
                  ? () => quickEdit?.onStartEdit(page.id)
                  : undefined
              }
            />
          );
        })
      ) : (
        <motion.section
          className="paper-card template-card rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="template-tab px-6 py-3">
            <h2 className="font-body font-medium flex items-center gap-2">
              <Feather className="w-5 h-5" />
              プレビュー
            </h2>
          </div>
          <div className="p-6 text-ink-soft font-body">
            デザイン画像の準備中です。もう一度開くと表示されます。
          </div>
        </motion.section>
      )}
    </div>
  );
}
