"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Loader2,
  Save,
} from "lucide-react";
import type { EditableTextLine, FullModePageStyle } from "@/types/trip";
import { FONT_OPTIONS, COLOR_PRESETS, getFontCss } from "./EditPanel";

interface FullModeLineEditorProps {
  lines: EditableTextLine[];
  style: FullModePageStyle;
  pageName: string;
  onLinesChange: (lines: EditableTextLine[]) => void;
  onStyleChange: (style: FullModePageStyle) => void;
  onSave: () => void;
  isSaving: boolean;
  onCancel?: () => void;
  canSave?: boolean;
}

export function FullModeLineEditor({
  lines,
  style,
  pageName,
  onLinesChange,
  onStyleChange,
  onSave,
  isSaving,
  onCancel,
  canSave = true,
}: FullModeLineEditorProps) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  // Sort lines by order
  const sortedLines = [...lines].sort((a, b) => a.order - b.order);

  // Update line content
  const handleLineChange = useCallback(
    (id: string, content: string) => {
      const updated = lines.map((line) =>
        line.id === id ? { ...line, content } : line
      );
      onLinesChange(updated);
    },
    [lines, onLinesChange]
  );

  // Move line up
  const moveLineUp = useCallback(
    (id: string) => {
      const lineIndex = sortedLines.findIndex((l) => l.id === id);
      if (lineIndex <= 0) return;

      const prevLine = sortedLines[lineIndex - 1];
      const currentLine = sortedLines[lineIndex];

      const updated = lines.map((line) => {
        if (line.id === currentLine.id) {
          return { ...line, order: prevLine.order };
        }
        if (line.id === prevLine.id) {
          return { ...line, order: currentLine.order };
        }
        return line;
      });
      onLinesChange(updated);
    },
    [lines, sortedLines, onLinesChange]
  );

  // Move line down
  const moveLineDown = useCallback(
    (id: string) => {
      const lineIndex = sortedLines.findIndex((l) => l.id === id);
      if (lineIndex >= sortedLines.length - 1) return;

      const nextLine = sortedLines[lineIndex + 1];
      const currentLine = sortedLines[lineIndex];

      const updated = lines.map((line) => {
        if (line.id === currentLine.id) {
          return { ...line, order: nextLine.order };
        }
        if (line.id === nextLine.id) {
          return { ...line, order: currentLine.order };
        }
        return line;
      });
      onLinesChange(updated);
    },
    [lines, sortedLines, onLinesChange]
  );

  // Add new line
  const addLine = useCallback(() => {
    const maxOrder = Math.max(...lines.map((l) => l.order), -1);
    const newLine: EditableTextLine = {
      id: `line-${Date.now()}`,
      content: "",
      order: maxOrder + 1,
    };
    onLinesChange([...lines, newLine]);
    setEditingLineId(newLine.id);
  }, [lines, onLinesChange]);

  // Delete line
  const deleteLine = useCallback(
    (id: string) => {
      const updated = lines.filter((line) => line.id !== id);
      // Reorder remaining lines
      const reordered = updated
        .sort((a, b) => a.order - b.order)
        .map((line, index) => ({ ...line, order: index }));
      onLinesChange(reordered);
    },
    [lines, onLinesChange]
  );

  // Style handlers
  const handleFontChange = useCallback(
    (fontFamily: string) => {
      onStyleChange({ ...style, fontFamily });
    },
    [style, onStyleChange]
  );

  const handleColorChange = useCallback(
    (primaryColor: string) => {
      onStyleChange({ ...style, primaryColor });
    },
    [style, onStyleChange]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-gray-900">テキスト編集</h3>
            <p className="text-xs text-gray-500 mt-0.5">{pageName}</p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              閉じる
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Page Style Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">ページスタイル</h4>

          {/* Font selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">フォント</label>
            <select
              value={style.fontFamily || "zen-kaku-gothic"}
              onChange={(e) => handleFontChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: getFontCss(style.fontFamily || "zen-kaku-gothic") }}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.cssVar }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">文字色</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    style.primaryColor === color.value
                      ? "border-blue-500 scale-110"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            {/* Custom color input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={style.primaryColor || "#333333"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={style.primaryColor || "#333333"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#333333"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Text Lines Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">テキスト行</h4>
          <p className="text-xs text-gray-500">
            行の内容を編集し、順序を変更できます。配置はAIが自動で調整します。
          </p>

          {/* Line list */}
          <div className="space-y-2">
            {sortedLines.map((line, index) => (
              <motion.div
                key={line.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col">
                  <button
                    onClick={() => moveLineUp(line.id)}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="上に移動"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveLineDown(line.id)}
                    disabled={index === sortedLines.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="下に移動"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Text input */}
                <div className="flex-1">
                  {editingLineId === line.id ? (
                    <textarea
                      value={line.content}
                      onChange={(e) => handleLineChange(line.id, e.target.value)}
                      onBlur={() => setEditingLineId(null)}
                      autoFocus
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : (
                    <div
                      onClick={() => setEditingLineId(line.id)}
                      className="px-2 py-1 text-sm text-gray-700 cursor-text hover:bg-white rounded min-h-[2rem]"
                    >
                      {line.content || (
                        <span className="text-gray-400 italic">クリックして編集</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deleteLine(line.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="削除"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Add line button */}
          <button
            onClick={addLine}
            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            行を追加
          </button>
        </div>
      </div>

      {/* Footer with save button */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onSave}
          disabled={isSaving || !canSave}
          className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              再生成中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存して再生成
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          保存すると、AIがテキストを配置した新しい画像を生成します
        </p>
      </div>
    </div>
  );
}
