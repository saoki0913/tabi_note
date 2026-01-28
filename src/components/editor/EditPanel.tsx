"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Plus,
  Layers,
  MousePointer2,
} from "lucide-react";
import type { TextLayer, TextLayerStyle, ZoneType } from "@/types/trip";
import { generateId } from "@/lib/storage";

// Available font families (10 fonts)
// value: CSS variable key, cssVar: actual CSS variable for styling
const FONT_OPTIONS = [
  { value: "zen-kaku-gothic", label: "ゴシック", cssVar: "var(--font-zen-kaku-gothic)" },
  { value: "zen-old-mincho", label: "明朝", cssVar: "var(--font-zen-old-mincho)" },
  { value: "noto-serif", label: "セリフ", cssVar: "var(--font-noto-serif)" },
  { value: "m-plus-rounded", label: "丸ゴシック", cssVar: "var(--font-display)" },
  { value: "kosugi-maru", label: "小杉丸", cssVar: "var(--font-kosugi-maru)" },
  { value: "sawarabi-gothic", label: "さわらび", cssVar: "var(--font-sawarabi-gothic)" },
  { value: "klee-one", label: "クレー", cssVar: "var(--font-klee-one)" },
  { value: "shippori-mincho", label: "しっぽり", cssVar: "var(--font-shippori-mincho)" },
  { value: "dela-gothic", label: "デラゴシック", cssVar: "var(--font-dela-gothic)" },
  { value: "kaisei-decol", label: "解星デコール", cssVar: "var(--font-kaisei-decol)" },
];

// Map font key to CSS variable for styling (also handles legacy font names)
export const FONT_CSS_MAP: Record<string, string> = {
  // New CSS variable keys
  "zen-kaku-gothic": "var(--font-zen-kaku-gothic)",
  "zen-old-mincho": "var(--font-zen-old-mincho)",
  "noto-serif": "var(--font-noto-serif)",
  "m-plus-rounded": "var(--font-display)",
  "kosugi-maru": "var(--font-kosugi-maru)",
  "sawarabi-gothic": "var(--font-sawarabi-gothic)",
  "klee-one": "var(--font-klee-one)",
  "shippori-mincho": "var(--font-shippori-mincho)",
  "dela-gothic": "var(--font-dela-gothic)",
  "kaisei-decol": "var(--font-kaisei-decol)",
  // Legacy font names (for backward compatibility)
  "Zen Kaku Gothic New": "var(--font-zen-kaku-gothic)",
  "Zen Old Mincho": "var(--font-zen-old-mincho)",
  "Noto Serif JP": "var(--font-noto-serif)",
  "M PLUS Rounded 1c": "var(--font-display)",
  "Kosugi Maru": "var(--font-kosugi-maru)",
  "Sawarabi Gothic": "var(--font-sawarabi-gothic)",
  "Klee One": "var(--font-klee-one)",
  "Shippori Mincho": "var(--font-shippori-mincho)",
  "Dela Gothic One": "var(--font-dela-gothic)",
  "Kaisei Decol": "var(--font-kaisei-decol)",
};

// Helper to get CSS font-family value from font key
export function getFontCss(fontKey: string): string {
  return FONT_CSS_MAP[fontKey] || "var(--font-zen-kaku-gothic)";
}

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

// Zone type labels
const ZONE_LABELS: Record<ZoneType, string> = {
  title: "タイトル",
  subtitle: "サブタイトル",
  header: "ヘッダー",
  body: "本文",
  footer: "フッター",
  caption: "キャプション",
  date: "日付",
  "list-item": "リスト",
  members: "メンバー",
  label: "ラベル",
};

interface EditPanelProps {
  selectedLayer: TextLayer | null;
  layerEdits?: {
    content?: string;
    style?: Partial<TextLayerStyle>;
  };
  isEditable: boolean;
  onTextChange: (content: string) => void;
  onStyleChange: (style: Partial<TextLayerStyle>) => void;
  onAddLayer: (layer: TextLayer) => void;
}

export function EditPanel({
  selectedLayer,
  layerEdits,
  isEditable,
  onTextChange,
  onStyleChange,
  onAddLayer,
}: EditPanelProps) {
  // Get effective content and style (with edits applied)
  const effectiveContent = layerEdits?.content ?? selectedLayer?.content ?? "";
  const effectiveStyle: TextLayerStyle = {
    ...(selectedLayer?.style ?? {
      fontSize: 14,
      fontFamily: "zen-kaku-gothic",
      fontWeight: 400,
      color: "#333333",
      alignment: "left",
      lineHeight: 1.5,
    }),
    ...(layerEdits?.style ?? {}),
  };

  // Local state for textarea to prevent cursor jumping
  const [localContent, setLocalContent] = useState(effectiveContent);

  // Sync local content with effective content when layer changes
  useEffect(() => {
    setLocalContent(effectiveContent);
  }, [effectiveContent, selectedLayer?.id]);

  // Handle text change with debouncing
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalContent(value);
      onTextChange(value);
    },
    [onTextChange]
  );

  // Handle style changes
  const handleFontChange = useCallback(
    (fontFamily: string) => {
      onStyleChange({ fontFamily });
    },
    [onStyleChange]
  );

  const handleFontSizeChange = useCallback(
    (fontSize: number) => {
      onStyleChange({ fontSize });
    },
    [onStyleChange]
  );

  const handleWeightToggle = useCallback(() => {
    onStyleChange({ fontWeight: effectiveStyle.fontWeight === 700 ? 400 : 700 });
  }, [onStyleChange, effectiveStyle.fontWeight]);

  const handleAlignmentChange = useCallback(
    (alignment: "left" | "center" | "right") => {
      onStyleChange({ alignment });
    },
    [onStyleChange]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      onStyleChange({ color });
    },
    [onStyleChange]
  );

  // Handle add new layer
  const handleAddLayer = useCallback(() => {
    const newLayer: TextLayer = {
      id: generateId(),
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
        lineHeight: 1.5,
      },
    };
    onAddLayer(newLayer);
  }, [onAddLayer]);

  return (
    <div className="h-full flex flex-col bg-white border-l border-paper-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-paper-200 bg-paper-50">
        <h2 className="font-display text-lg text-ink flex items-center gap-2">
          <Type className="w-5 h-5 text-accent-coral" />
          テキスト編集
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isEditable ? (
          // Full mode - not editable
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-paper-100 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-ink-soft" />
            </div>
            <h3 className="font-ui font-medium text-ink mb-2">
              一発生成モード
            </h3>
            <p className="text-sm text-ink-soft">
              このしおりはAIが文字を含む完全な画像として生成されています。
              テキストを編集するには、再生成時に「編集可能モード」を選択してください。
            </p>
          </div>
        ) : !selectedLayer ? (
          // No layer selected
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-paper-100 flex items-center justify-center mb-4">
              <MousePointer2 className="w-8 h-8 text-ink-soft" />
            </div>
            <h3 className="font-ui font-medium text-ink mb-2">
              レイヤーを選択
            </h3>
            <p className="text-sm text-ink-soft mb-6">
              左のプレビューでテキストをクリックして編集を開始します。
            </p>

            {/* Add layer button */}
            <motion.button
              onClick={handleAddLayer}
              className="flex items-center gap-2 px-4 py-2.5 btn btn-primary btn-pill text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              テキストを追加
            </motion.button>
          </div>
        ) : (
          // Layer selected - show editor
          <div className="space-y-4">
            {/* Layer info */}
            <div className="p-3 bg-paper-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-ink-soft mb-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                  {ZONE_LABELS[selectedLayer.zoneType] || selectedLayer.zoneType}
                </span>
              </div>
            </div>

            {/* Text editing area */}
            <div>
              <label className="text-xs text-ink-soft mb-2 block font-ui">
                テキスト内容
              </label>
              <textarea
                value={localContent}
                onChange={handleTextChange}
                className="w-full min-h-[150px] p-3 border border-paper-200 rounded-lg
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                           transition-all resize-none font-body text-ink"
                placeholder="テキストを入力..."
                style={{
                  fontFamily: getFontCss(effectiveStyle.fontFamily),
                  textAlign: effectiveStyle.alignment,
                }}
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-xs text-ink-soft mb-2 block font-ui">
                フォント
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FONT_OPTIONS.map((font) => {
                  // Check if this font is selected (handles both new and legacy format)
                  const isSelected = effectiveStyle.fontFamily === font.value ||
                    getFontCss(effectiveStyle.fontFamily) === font.cssVar;
                  return (
                    <button
                      key={font.value}
                      onClick={() => handleFontChange(font.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-paper-100 hover:bg-paper-200 text-ink"
                      }`}
                      style={{ fontFamily: font.cssVar }}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs text-ink-soft mb-2 flex items-center justify-between font-ui">
                <span>サイズ</span>
                <span className="font-mono text-ink">{effectiveStyle.fontSize}px</span>
              </label>
              <input
                type="range"
                min="8"
                max="72"
                step="1"
                value={effectiveStyle.fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-ink-soft mt-1">
                <span>8px</span>
                <span>72px</span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <label className="text-xs text-ink-soft mb-2 flex items-center justify-between font-ui">
                <span>行間</span>
                <span className="font-mono text-ink">{effectiveStyle.lineHeight?.toFixed(1) ?? "1.5"}</span>
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={effectiveStyle.lineHeight ?? 1.5}
                onChange={(e) => onStyleChange({ lineHeight: Number(e.target.value) })}
                className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-ink-soft mt-1">
                <span>1.0</span>
                <span>3.0</span>
              </div>
            </div>

            {/* Font Weight & Alignment */}
            <div>
              <label className="text-xs text-ink-soft mb-2 block font-ui">
                スタイル
              </label>
              <div className="flex items-center gap-2">
                {/* Bold toggle */}
                <button
                  onClick={handleWeightToggle}
                  className={`p-2.5 rounded-lg transition-colors ${
                    effectiveStyle.fontWeight === 700
                      ? "bg-blue-500 text-white"
                      : "bg-paper-100 hover:bg-paper-200 text-ink"
                  }`}
                  title="太字"
                >
                  <Bold className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-paper-200" />

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
                      className={`p-2.5 rounded-lg transition-colors ${
                        effectiveStyle.alignment === value
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
            </div>

            {/* Color */}
            <div>
              <label className="text-xs text-ink-soft mb-2 block font-ui">
                色
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      effectiveStyle.color === color.value
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
                    value={effectiveStyle.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer appearance-none border-2 border-paper-200 hover:border-paper-300"
                    title="カスタム色"
                  />
                </div>
              </div>
            </div>

            {/* Add another layer */}
            <div className="pt-4 border-t border-paper-200">
              <motion.button
                onClick={handleAddLayer}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 btn btn-soft btn-pill text-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Plus className="w-4 h-4" />
                テキストを追加
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
