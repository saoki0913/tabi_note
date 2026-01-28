"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Download, FileText, Loader2 } from "lucide-react";
import type { Trip } from "../types/trip";

interface PdfExportProps {
  trip: Trip;
}

export function PdfExport({ trip }: PdfExportProps) {
  const [pdfSize, setPdfSize] = useState<"a4" | "a5" | "bookmark">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedPages = trip.design?.pages?.length
    ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
    : null;
  const hasGeneratedPages = Boolean(sortedPages?.length);
  const canGenerate = hasGeneratedPages && !isGenerating;

  const generatePdf = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);

    try {
      // サーバーサイドAPIを呼び出し
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip,
          paperSize: pdfSize,
          orientation,
          dpi: "print",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "PDF生成に失敗しました");
      }

      const { pdf, filename } = await response.json();

      // Base64からBlobを作成してダウンロード
      const byteCharacters = atob(pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert(
        error instanceof Error
          ? error.message
          : "PDF生成中にエラーが発生しました。",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="paper-card paper-stack rounded-3xl p-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <FileText className="w-10 h-10 text-accent-coral" />
        <h2 className="text-4xl font-display gradient-text-warm">PDF書き出し</h2>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block font-ui font-semibold mb-4 text-xl text-ink">
            用紙サイズ
          </label>
          <div className="grid grid-cols-3 gap-5">
            <motion.button
              onClick={() => setPdfSize("a4")}
              className={`choice-card p-6 ${pdfSize === "a4" ? "is-selected" : ""}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              <div className="text-5xl mb-3">📄</div>
              <div className="font-ui font-semibold text-lg text-ink">A4</div>
              <div className="text-sm text-ink-soft mt-1">210×297mm</div>
            </motion.button>
            <motion.button
              onClick={() => setPdfSize("a5")}
              className={`choice-card p-6 ${pdfSize === "a5" ? "is-selected" : ""}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              <div className="text-5xl mb-3">📕</div>
              <div className="font-ui font-semibold text-lg text-ink">A5（冊子）</div>
              <div className="text-sm text-ink-soft mt-1">148×210mm</div>
            </motion.button>
            <motion.button
              onClick={() => setPdfSize("bookmark")}
              className={`choice-card p-6 ${pdfSize === "bookmark" ? "is-selected" : ""}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
            >
              <div className="text-5xl mb-3">🔖</div>
              <div className="font-ui font-semibold text-lg text-ink">しおりサイズ</div>
              <div className="text-sm text-ink-soft mt-1">55×180mm</div>
            </motion.button>
          </div>
        </div>

        {pdfSize !== "bookmark" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <label className="block font-ui font-semibold mb-4 text-xl text-ink">
              向き
            </label>
            <div className="grid grid-cols-2 gap-5">
              <motion.button
                onClick={() => setOrientation("portrait")}
                className={`choice-card p-6 flex items-center justify-center gap-4 ${
                  orientation === "portrait" ? "is-selected" : ""
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                <div className="text-5xl">📱</div>
                <div className="font-ui font-semibold text-xl text-ink">縦</div>
              </motion.button>
              <motion.button
                onClick={() => setOrientation("landscape")}
                className={`choice-card p-6 flex items-center justify-center gap-4 ${
                  orientation === "landscape" ? "is-selected" : ""
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                <div className="text-5xl">💻</div>
                <div className="font-ui font-semibold text-xl text-ink">横</div>
              </motion.button>
            </div>
          </motion.div>
        )}

        <motion.button
          onClick={generatePdf}
          disabled={!canGenerate}
          className={`w-full py-6 btn btn-primary text-xl flex items-center justify-center gap-4 ${
            !canGenerate ? "opacity-50 cursor-not-allowed" : ""
          }`}
          whileHover={!canGenerate ? {} : { scale: 1.03 }}
          whileTap={!canGenerate ? {} : { scale: 0.97 }}
          type="button"
        >
          {isGenerating ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Download className="w-8 h-8" />
          )}
          {isGenerating ? "PDF生成中..." : "PDFをダウンロード"}
        </motion.button>

        <motion.div
          className="note-callout p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-base text-ink-soft leading-relaxed">
            💡 <strong className="text-lg text-ink">ヒント:</strong> PDFは高品質な印刷用に最適化されています。生成には少し時間がかかる場合があります。
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
