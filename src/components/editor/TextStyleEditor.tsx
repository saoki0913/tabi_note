"use client";

import { useCallback } from "react";
import { motion } from "motion/react";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  X,
} from "lucide-react";
import type { TextLayerStyle } from "@/types/trip";

// Available font families
const FONT_OPTIONS = [
  { value: "Zen Kaku Gothic New", label: "ゴシック" },
  { value: "Zen Old Mincho", label: "明朝" },
  { value: "Noto Serif JP", label: "セリフ" },
  { value: "M PLUS Rounded 1c", label: "丸ゴシック" },
  { value: "Kosugi Maru", label: "小杉丸" },
];

// Preset colors
const COLOR_PRESETS = [
  { value: "#333333", label: "黒" },
  { value: "#ffffff", label: "白" },
  { value: "#1a1a1a", label: "墨" },
  { value: "#4a5568", label: "灰" },
  { value: "#2563eb", label: "青" },
  { value: "#059669", label: "緑" },
  { value: "#dc2626", label: "赤" },
  { value: "#d97706", label: "橙" },
  { value: "#7c3aed", label: "紫" },
  { value: "#db2777", label: "桃" },
];

interface TextStyleEditorProps {
  style: TextLayerStyle;
  onChange: (style: Partial<TextLayerStyle>) => void;
  onClose: () => void;
}

export function TextStyleEditor({
  style,
  onChange,
  onClose,
}: TextStyleEditorProps) {
  // Handle font family change
  const handleFontChange = useCallback(
    (fontFamily: string) => {
      onChange({ fontFamily });
    },
    [onChange]
  );

  // Handle font size change
  const handleFontSizeChange = useCallback(
    (fontSize: number) => {
      onChange({ fontSize });
    },
    [onChange]
  );

  // Handle font weight toggle
  const handleWeightToggle = useCallback(() => {
    onChange({ fontWeight: style.fontWeight === 700 ? 400 : 700 });
  }, [onChange, style.fontWeight]);

  // Handle alignment change
  const handleAlignmentChange = useCallback(
    (alignment: "left" | "center" | "right") => {
      onChange({ alignment });
    },
    [onChange]
  );

  // Handle color change
  const handleColorChange = useCallback(
    (color: string) => {
      onChange({ color });
    },
    [onChange]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-lg shadow-xl border border-paper-200 p-3 min-w-[280px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-paper-100">
        <h3 className="text-sm font-medium text-ink flex items-center gap-1.5">
          <Type className="w-4 h-4" />
          スタイル編集
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-paper-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-ink-soft" />
        </button>
      </div>

      {/* Font Family */}
      <div className="mb-3">
        <label className="text-xs text-ink-soft mb-1 block">フォント</label>
        <div className="flex flex-wrap gap-1">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.value}
              onClick={() => handleFontChange(font.value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                style.fontFamily === font.value
                  ? "bg-blue-500 text-white"
                  : "bg-paper-100 hover:bg-paper-200 text-ink"
              }`}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="mb-3">
        <label className="text-xs text-ink-soft mb-1 flex items-center justify-between">
          <span>サイズ</span>
          <span className="font-mono">{style.fontSize}px</span>
        </label>
        <input
          type="range"
          min="8"
          max="72"
          step="1"
          value={style.fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-ink-soft mt-0.5">
          <span>8</span>
          <span>72</span>
        </div>
      </div>

      {/* Font Weight & Alignment */}
      <div className="mb-3 flex items-center gap-2">
        {/* Bold toggle */}
        <button
          onClick={handleWeightToggle}
          className={`p-2 rounded transition-colors ${
            style.fontWeight === 700
              ? "bg-blue-500 text-white"
              : "bg-paper-100 hover:bg-paper-200 text-ink"
          }`}
          title="太字"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-paper-200" />

        {/* Alignment buttons */}
        <div className="flex gap-1">
          {[
            { value: "left" as const, icon: AlignLeft, label: "左揃え" },
            { value: "center" as const, icon: AlignCenter, label: "中央揃え" },
            { value: "right" as const, icon: AlignRight, label: "右揃え" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleAlignmentChange(value)}
              className={`p-2 rounded transition-colors ${
                style.alignment === value
                  ? "bg-blue-500 text-white"
                  : "bg-paper-100 hover:bg-paper-200 text-ink"
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs text-ink-soft mb-1 block">色</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorChange(color.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                style.color === color.value
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-paper-200 hover:border-paper-300"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
          {/* Custom color input */}
          <div className="relative">
            <input
              type="color"
              value={style.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer appearance-none border-2 border-paper-200 hover:border-paper-300"
              title="カスタム色"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
