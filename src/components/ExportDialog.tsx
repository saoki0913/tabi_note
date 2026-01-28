"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  FileImage,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Printer,
  Monitor,
  Smartphone,
} from "lucide-react";
import type { Trip } from "@/types/trip";

interface ExportDialogProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "png" | "pdf";
type DpiLevel = "screen" | "web" | "print";
type PaperSize = "a4" | "a5" | "bookmark";

interface DpiOption {
  value: DpiLevel;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface PaperOption {
  value: PaperSize;
  label: string;
  description: string;
}

const DPI_OPTIONS: DpiOption[] = [
  {
    value: "screen",
    label: "標準",
    description: "72 DPI - Web表示向け",
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    value: "web",
    label: "高解像度",
    description: "150 DPI - スマホ・タブレット向け",
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    value: "print",
    label: "印刷用",
    description: "300 DPI - 高品質印刷向け",
    icon: <Printer className="w-4 h-4" />,
  },
];

const PAPER_OPTIONS: PaperOption[] = [
  { value: "a4", label: "A4", description: "210 × 297 mm" },
  { value: "a5", label: "A5", description: "148 × 210 mm" },
  { value: "bookmark", label: "しおりサイズ", description: "50 × 150 mm" },
];

export function ExportDialog({ trip, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [dpi, setDpi] = useState<DpiLevel>("print");
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const pages = trip.design?.pages || [];
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  // Export individual PNG files
  const exportPng = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress("準備中...");

    try {
      for (let i = 0; i < sortedPages.length; i++) {
        const page = sortedPages[i];
        setExportProgress(`ページ ${i + 1}/${sortedPages.length} を処理中...`);

        const response = await fetch("/api/export/png", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trip,
            pageId: page.id,
            dpi,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "PNG export failed");
        }

        const data = await response.json();

        // Download the PNG
        const link = document.createElement("a");
        link.download = `${trip.title || "shiori"}_${page.label}.png`;
        link.href = `data:${data.mimeType};base64,${data.base64}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      setExportSuccess(true);
      setExportProgress("書き出し完了!");
    } catch (error) {
      console.error("PNG export error:", error);
      setExportError(error instanceof Error ? error.message : "書き出しに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [trip, sortedPages, dpi]);

  // Export PDF
  const exportPdf = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress("PDFを生成中...");

    try {
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip,
          paperSize,
          orientation: "portrait",
          dpi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "PDF export failed");
      }

      const data = await response.json();

      // Download the PDF
      const link = document.createElement("a");
      link.download = data.filename;
      link.href = `data:application/pdf;base64,${data.pdf}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setExportProgress(`書き出し完了! (${data.pageCount}ページ)`);
    } catch (error) {
      console.error("PDF export error:", error);
      setExportError(error instanceof Error ? error.message : "書き出しに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [trip, paperSize, dpi]);

  // Handle export button click
  const handleExport = useCallback(() => {
    setExportSuccess(false);
    if (format === "png") {
      exportPng();
    } else {
      exportPdf();
    }
  }, [format, exportPng, exportPdf]);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    if (!isExporting) {
      setExportError(null);
      setExportSuccess(false);
      setExportProgress("");
      onClose();
    }
  }, [isExporting, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
          />

          {/* Dialog Container - Flexboxでセンタリング */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            {/* Modal Content */}
            <div
              className="relative w-full max-w-md max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200 flex-shrink-0">
                <h2 className="font-display text-xl text-ink">書き出し設定</h2>
                <button
                  onClick={handleClose}
                  disabled={isExporting}
                  className="p-2 text-ink-soft hover:text-ink hover:bg-paper-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
              {/* Format selection */}
              <div>
                <label className="block text-sm font-medium text-ink mb-3">
                  フォーマット
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat("pdf")}
                    disabled={isExporting}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      format === "pdf"
                        ? "border-blue-500 bg-blue-50"
                        : "border-paper-200 hover:border-paper-300"
                    }`}
                  >
                    <FileText
                      className={`w-8 h-8 ${
                        format === "pdf" ? "text-blue-500" : "text-ink-soft"
                      }`}
                    />
                    <span className="font-medium">PDF</span>
                    <span className="text-xs text-ink-soft">まとめて1ファイル</span>
                  </button>
                  <button
                    onClick={() => setFormat("png")}
                    disabled={isExporting}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      format === "png"
                        ? "border-blue-500 bg-blue-50"
                        : "border-paper-200 hover:border-paper-300"
                    }`}
                  >
                    <FileImage
                      className={`w-8 h-8 ${
                        format === "png" ? "text-blue-500" : "text-ink-soft"
                      }`}
                    />
                    <span className="font-medium">PNG</span>
                    <span className="text-xs text-ink-soft">ページごとに画像</span>
                  </button>
                </div>
              </div>

              {/* Paper size (PDF only) */}
              {format === "pdf" && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-3">
                    用紙サイズ
                  </label>
                  <div className="flex gap-2">
                    {PAPER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPaperSize(option.value)}
                        disabled={isExporting}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          paperSize === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-paper-100 text-ink hover:bg-paper-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DPI selection */}
              <div>
                <label className="block text-sm font-medium text-ink mb-3">
                  解像度
                </label>
                <div className="space-y-2">
                  {DPI_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDpi(option.value)}
                      disabled={isExporting}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        dpi === option.value
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "bg-paper-50 border-2 border-transparent hover:bg-paper-100"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          dpi === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-paper-200 text-ink-soft"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-ink">{option.label}</div>
                        <div className="text-xs text-ink-soft">{option.description}</div>
                      </div>
                      {dpi === option.value && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page count info */}
              <div className="flex items-center justify-between text-sm text-ink-soft bg-paper-50 rounded-lg px-4 py-3">
                <span>書き出しページ数</span>
                <span className="font-medium text-ink">{sortedPages.length}ページ</span>
              </div>

              {/* Error message */}
              {exportError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">エラー</div>
                    <div className="text-sm">{exportError}</div>
                  </div>
                </div>
              )}

              {/* Success message */}
              {exportSuccess && (
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg">
                  <Check className="w-5 h-5" />
                  <span>{exportProgress}</span>
                </div>
              )}
            </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-paper-200 bg-paper-50 rounded-b-2xl flex-shrink-0">
                <button
                  onClick={handleClose}
                  disabled={isExporting}
                  className="px-4 py-2 text-ink-soft hover:text-ink transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <motion.button
                  onClick={handleExport}
                  disabled={isExporting || sortedPages.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {exportProgress}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      書き出す
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
