"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { TextLayer } from "@/types/trip";
import { getFontCss } from "./EditPanel";

interface TextLayerRendererProps {
  layer: TextLayer;
  containerWidth: number;
  containerHeight: number;
  isEditing: boolean;
  isSelected?: boolean;
  onStartEdit: () => void;
  onEndEdit: (newContent: string) => void;
  onClick?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

// 8 resize handle positions
type ResizeDirection = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface ResizeHandleConfig {
  position: ResizeDirection;
  cursor: string;
  style: React.CSSProperties;
}

const RESIZE_HANDLES: ResizeHandleConfig[] = [
  { position: "nw", cursor: "nwse-resize", style: { top: -4, left: -4 } },
  { position: "n", cursor: "ns-resize", style: { top: -4, left: "50%", transform: "translateX(-50%)" } },
  { position: "ne", cursor: "nesw-resize", style: { top: -4, right: -4 } },
  { position: "e", cursor: "ew-resize", style: { top: "50%", right: -4, transform: "translateY(-50%)" } },
  { position: "se", cursor: "nwse-resize", style: { bottom: -4, right: -4 } },
  { position: "s", cursor: "ns-resize", style: { bottom: -4, left: "50%", transform: "translateX(-50%)" } },
  { position: "sw", cursor: "nesw-resize", style: { bottom: -4, left: -4 } },
  { position: "w", cursor: "ew-resize", style: { top: "50%", left: -4, transform: "translateY(-50%)" } },
];

// Zone type to Japanese label mapping
const ZONE_TYPE_LABELS: Record<string, string> = {
  title: "タイトル",
  subtitle: "サブタイトル",
  body: "本文",
  date: "日付",
  members: "メンバー",
  "list-item": "リスト",
  caption: "キャプション",
  label: "ラベル",
  header: "ヘッダー",
  footer: "フッター",
};

// Get border color based on zone type
function getZoneColor(zoneType: string): {
  border: string;
  bg: string;
  hoverBg: string;
} {
  switch (zoneType) {
    case "title":
    case "header":
      return {
        border: "rgba(59, 130, 246, 0.6)", // blue
        bg: "rgba(59, 130, 246, 0.05)",
        hoverBg: "rgba(59, 130, 246, 0.15)",
      };
    case "subtitle":
    case "caption":
      return {
        border: "rgba(139, 92, 246, 0.6)", // purple
        bg: "rgba(139, 92, 246, 0.05)",
        hoverBg: "rgba(139, 92, 246, 0.15)",
      };
    case "body":
    case "list-item":
      return {
        border: "rgba(34, 197, 94, 0.6)", // green
        bg: "rgba(34, 197, 94, 0.05)",
        hoverBg: "rgba(34, 197, 94, 0.15)",
      };
    case "date":
    case "members":
    case "label":
      return {
        border: "rgba(251, 146, 60, 0.6)", // orange
        bg: "rgba(251, 146, 60, 0.05)",
        hoverBg: "rgba(251, 146, 60, 0.15)",
      };
    default:
      return {
        border: "rgba(100, 100, 100, 0.6)", // gray
        bg: "rgba(100, 100, 100, 0.05)",
        hoverBg: "rgba(100, 100, 100, 0.15)",
      };
  }
}

export function TextLayerRenderer({
  layer,
  containerWidth,
  containerHeight,
  isEditing,
  isSelected = false,
  onStartEdit,
  onEndEdit,
  onClick,
  onPositionChange,
  onSizeChange,
}: TextLayerRendererProps) {
  const [editValue, setEditValue] = useState(layer.content);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; layerX: number; layerY: number } | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    layerX: number;
    layerY: number;
    layerWidth: number;
    layerHeight: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Get zone-based colors
  const colors = useMemo(() => getZoneColor(layer.zoneType), [layer.zoneType]);

  // Get zone type label
  const zoneLabel = ZONE_TYPE_LABELS[layer.zoneType] || layer.zoneType;

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
    // Base font size is defined for 595px width canvas
    const baseCanvasWidth = 595;
    const scale = containerWidth / baseCanvasWidth;
    return Math.max(8, layer.style.fontSize * scale);
  }, [layer.style.fontSize, containerWidth]);

  // Reset edit value when layer content changes
  useEffect(() => {
    setEditValue(layer.content);
  }, [layer.content]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without shift confirms edit
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onEndEdit(editValue);
      }
      // Escape cancels edit
      if (e.key === "Escape") {
        e.preventDefault();
        setEditValue(layer.content);
        onEndEdit(layer.content);
      }
    },
    [editValue, layer.content, onEndEdit]
  );

  const handleBlur = useCallback(() => {
    onEndEdit(editValue);
  }, [editValue, onEndEdit]);

  // Handle double-click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!layer.locked) {
      onStartEdit();
    }
  }, [layer.locked, onStartEdit]);

  // Handle single click for selection
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onClick?.();
    }
  }, [onClick, isDragging]);

  // Handle mouse down for drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (layer.locked || isEditing) return;

    // Only start drag on left mouse button
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    setDragStart({
      x: e.clientX,
      y: e.clientY,
      layerX: layer.position.x,
      layerY: layer.position.y,
    });
  }, [layer.locked, layer.position, isEditing]);

  // Handle mouse move for dragging
  useEffect(() => {
    if (!dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Check if we've moved enough to start dragging
      if (!isDragging && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
        setIsDragging(true);
      }

      if (isDragging || Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        // Calculate new normalized position
        const newX = dragStart.layerX + deltaX / containerWidth;
        const newY = dragStart.layerY + deltaY / containerHeight;

        // Clamp to container bounds (allow slight overflow for edge cases)
        const clampedX = Math.max(-0.1, Math.min(1.1, newX));
        const clampedY = Math.max(-0.1, Math.min(1.1, newY));

        onPositionChange?.({ x: clampedX, y: clampedY });
      }
    };

    const handleMouseUp = () => {
      // Small delay to prevent click from firing after drag
      setTimeout(() => {
        setIsDragging(false);
      }, 50);
      setDragStart(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragStart, isDragging, containerWidth, containerHeight, onPositionChange]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
    if (layer.locked || isEditing) return;
    e.preventDefault();
    e.stopPropagation();

    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      layerX: layer.position.x,
      layerY: layer.position.y,
      layerWidth: layer.size.width,
      layerHeight: layer.size.height,
    });
  }, [layer.locked, layer.position, layer.size, isEditing]);

  // Handle mouse move for resizing
  useEffect(() => {
    if (!resizeStart || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      // Normalize deltas to container size
      const normalizedDeltaX = deltaX / containerWidth;
      const normalizedDeltaY = deltaY / containerHeight;

      // Calculate new size and position based on resize direction
      let newX = resizeStart.layerX;
      let newY = resizeStart.layerY;
      let newWidth = resizeStart.layerWidth;
      let newHeight = resizeStart.layerHeight;

      // Minimum size constraints (normalized)
      const minWidth = 50 / containerWidth;
      const minHeight = 20 / containerHeight;

      // Handle horizontal resizing
      if (resizeDirection.includes("e")) {
        newWidth = Math.max(minWidth, resizeStart.layerWidth + normalizedDeltaX);
      } else if (resizeDirection.includes("w")) {
        const widthChange = normalizedDeltaX;
        newWidth = Math.max(minWidth, resizeStart.layerWidth - widthChange);
        if (newWidth > minWidth) {
          newX = resizeStart.layerX + widthChange;
        }
      }

      // Handle vertical resizing
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(minHeight, resizeStart.layerHeight + normalizedDeltaY);
      } else if (resizeDirection.includes("n")) {
        const heightChange = normalizedDeltaY;
        newHeight = Math.max(minHeight, resizeStart.layerHeight - heightChange);
        if (newHeight > minHeight) {
          newY = resizeStart.layerY + heightChange;
        }
      }

      setIsResizing(true);

      // Update position if it changed (for nw, n, ne, w, sw resizing)
      if (newX !== layer.position.x || newY !== layer.position.y) {
        onPositionChange?.({ x: newX, y: newY });
      }

      // Update size
      onSizeChange?.({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        setIsResizing(false);
      }, 50);
      setResizeStart(null);
      setResizeDirection(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeStart, resizeDirection, containerWidth, containerHeight, layer.position, onPositionChange, onSizeChange]);

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: pixelPosition.x,
    top: pixelPosition.y,
    width: pixelSize.width,
    minHeight: pixelSize.height,
    pointerEvents: "auto",
    opacity: layer.opacity ?? 1,
    transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
  };

  // Editing mode
  if (isEditing) {
    return (
      <div style={{ ...baseStyle, zIndex: 20 }}>
        {/* Zone type badge */}
        <div
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            backgroundColor: "#3b82f6",
            color: "white",
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "3px 3px 0 0",
            fontFamily: "sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {zoneLabel} - 編集中
        </div>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          style={{
            width: "100%",
            minHeight: pixelSize.height,
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            border: "2px solid #3b82f6",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: scaledFontSize,
            fontWeight: layer.style.fontWeight,
            color: layer.style.color,
            textAlign: layer.style.alignment,
            fontFamily: getFontCss(layer.style.fontFamily),
            lineHeight: layer.style.lineHeight,
            letterSpacing: layer.style.letterSpacing,
            resize: "vertical",
            outline: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        />
      </div>
    );
  }

  // Determine visual state
  const showBorder = isSelected || isHovered || isDragging || isResizing;
  const borderColor = isSelected ? "#3b82f6" : colors.border;
  const bgColor = isDragging || isResizing
    ? "rgba(59, 130, 246, 0.1)"
    : isSelected
    ? "rgba(59, 130, 246, 0.08)"
    : isHovered
    ? colors.hoverBg
    : "transparent";

  // Determine if this is a newly added layer that needs attention animation
  const isNewlyAdded = layer.isUserAdded;

  // Normal display mode - render text with styling
  return (
    <div
      ref={layerRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyle,
        cursor: isDragging ? "grabbing" : isResizing ? (resizeDirection ? RESIZE_HANDLES.find(h => h.position === resizeDirection)?.cursor : "default") : layer.locked ? "default" : isSelected ? "grab" : "pointer",
        borderRadius: layer.style.borderRadius || 0,
        border: showBorder
          ? isSelected
            ? `2px solid ${borderColor}`
            : `1px dashed ${borderColor}`
          : isNewlyAdded
          ? "2px dashed #10b981"
          : "1px solid transparent",
        backgroundColor: isNewlyAdded && !isSelected ? "rgba(16, 185, 129, 0.08)" : bgColor,
        transition: (isDragging || isResizing) ? "none" : "background-color 0.15s ease, border 0.15s ease",
        padding: layer.style.padding || 0,
        boxShadow: isSelected
          ? "0 2px 8px rgba(59, 130, 246, 0.25)"
          : isNewlyAdded
          ? "0 0 0 3px rgba(16, 185, 129, 0.15)"
          : undefined,
        userSelect: "none",
        animation: isNewlyAdded && !isSelected ? "pulse-glow 2s ease-in-out 3" : undefined,
      }}
      title={layer.locked ? "ロックされています" : isSelected ? "ドラッグで移動・ダブルクリックで編集" : "クリックで選択"}
    >
      {/* Zone type badge - visible on hover or when selected */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: "absolute",
            top: -18,
            left: 0,
            backgroundColor: isSelected ? "#3b82f6" : colors.border,
            color: "white",
            fontSize: "9px",
            padding: "1px 6px",
            borderRadius: "2px",
            fontFamily: "sans-serif",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {zoneLabel}
          {layer.locked && " 🔒"}
          {layer.isUserAdded && " ✨"}
        </div>
      )}

      {/* 8-direction resize handles - only when selected */}
      {isSelected && !isDragging && !layer.locked && (
        <>
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.position}
              onMouseDown={(e) => handleResizeStart(e, handle.position)}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                backgroundColor: "#3b82f6",
                borderRadius: "50%",
                border: "2px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                cursor: handle.cursor,
                pointerEvents: "auto",
                zIndex: 10,
                ...handle.style,
              }}
              title="リサイズ"
            />
          ))}
        </>
      )}

      {/* Actual text content */}
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
