"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { TextRegion } from "@/lib/analysis/types";

interface TextOverlayProps {
  region: TextRegion;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (newContent: string) => void;
}

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
};

// Get border color based on confidence
function getConfidenceColor(confidence: number): {
  border: string;
  bg: string;
  hoverBg: string;
} {
  if (confidence >= 0.9) {
    return {
      border: "rgba(34, 197, 94, 0.6)", // green
      bg: "rgba(34, 197, 94, 0.05)",
      hoverBg: "rgba(34, 197, 94, 0.15)",
    };
  }
  if (confidence >= 0.8) {
    return {
      border: "rgba(59, 130, 246, 0.6)", // blue
      bg: "rgba(59, 130, 246, 0.05)",
      hoverBg: "rgba(59, 130, 246, 0.15)",
    };
  }
  return {
    border: "rgba(251, 146, 60, 0.6)", // orange
    bg: "rgba(251, 146, 60, 0.05)",
    hoverBg: "rgba(251, 146, 60, 0.15)",
  };
}

export function TextOverlay({
  region,
  isEditing,
  onStartEdit,
  onEndEdit,
}: TextOverlayProps) {
  const [editValue, setEditValue] = useState(region.content);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get confidence-based colors
  const colors = useMemo(
    () => getConfidenceColor(region.confidence),
    [region.confidence]
  );

  // Get zone type label
  const zoneLabel = ZONE_TYPE_LABELS[region.zoneType] || region.zoneType;

  // Reset edit value when region content changes
  useEffect(() => {
    setEditValue(region.content);
  }, [region.content]);

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
        setEditValue(region.content);
        onEndEdit(region.content);
      }
    },
    [editValue, region.content, onEndEdit]
  );

  const handleBlur = useCallback(() => {
    onEndEdit(editValue);
  }, [editValue, onEndEdit]);

  // Handle double-click to edit
  const handleDoubleClick = useCallback(() => {
    onStartEdit();
  }, [onStartEdit]);

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: region.bounds.x,
    top: region.bounds.y,
    width: region.bounds.width,
    height: region.bounds.height,
    pointerEvents: "auto",
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
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            border: "2px solid #3b82f6",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: region.style.fontSize,
            fontWeight: region.style.fontWeight,
            color: region.style.color,
            textAlign: region.style.alignment,
            fontFamily: "'Zen Kaku Gothic New', sans-serif",
            lineHeight: 1.4,
            resize: "none",
            outline: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        />
      </div>
    );
  }

  // Normal mode - always visible border with hover enhancement
  return (
    <div
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyle,
        cursor: "pointer",
        borderRadius: "3px",
        border: `1px solid ${colors.border}`,
        backgroundColor: isHovered ? colors.hoverBg : colors.bg,
        transition: "all 0.15s ease",
        boxShadow: isHovered ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
      }}
      title="ダブルクリックで編集"
    >
      {/* Zone type badge - always visible */}
      <div
        style={{
          position: "absolute",
          top: -16,
          left: 0,
          backgroundColor: isHovered ? colors.border : "rgba(100, 100, 100, 0.7)",
          color: "white",
          fontSize: "9px",
          padding: "1px 4px",
          borderRadius: "2px",
          fontFamily: "sans-serif",
          whiteSpace: "nowrap",
          opacity: isHovered ? 1 : 0.8,
          transition: "all 0.15s ease",
        }}
      >
        {zoneLabel}
      </div>

      {/* Confidence indicator on hover */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            top: -16,
            right: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            fontSize: "9px",
            padding: "1px 4px",
            borderRadius: "2px",
            fontFamily: "sans-serif",
          }}
        >
          {Math.round(region.confidence * 100)}%
        </div>
      )}
    </div>
  );
}
