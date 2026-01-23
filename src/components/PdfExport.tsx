"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Download, FileText } from "lucide-react";
import type {
  DesignMode,
  TemplateType,
  Trip,
  TripDesignImage,
} from "../types/trip";

type Theme = {
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  line: string;
  paper: string;
};

const templateThemes: Record<TemplateType, Theme> = {
  minimal: {
    ink: "#1f2933",
    muted: "#6b7280",
    accent: "#111827",
    accentSoft: "#f3f4f6",
    line: "#d1d5db",
    paper: "#ffffff",
  },
  pop: {
    ink: "#1f2933",
    muted: "#6b7280",
    accent: "#f97316",
    accentSoft: "#ffedd5",
    line: "#fdba74",
    paper: "#fffaf3",
  },
  photo: {
    ink: "#111827",
    muted: "#4b5563",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
    line: "#93c5fd",
    paper: "#f8fafc",
  },
};

interface PdfExportProps {
  trip: Trip;
}

export function PdfExport({ trip }: PdfExportProps) {
  const [pdfSize, setPdfSize] = useState<"a4" | "a5" | "bookmark">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const theme = templateThemes[trip.templateType];
  const assetUrl = (mode: DesignMode) => {
    const legacyDesign = trip.design as
      | (Trip["design"] & {
          cover?: TripDesignImage;
          page?: TripDesignImage;
        })
      | undefined;
    const asset = legacyDesign?.assets?.[mode];
    const legacyAsset =
      asset || !legacyDesign
        ? null
        : mode === "cover"
          ? legacyDesign.cover
          : legacyDesign.page;
    const resolvedAsset = asset ?? legacyAsset;
    return resolvedAsset
      ? `data:${resolvedAsset.mimeType};base64,${resolvedAsset.base64}`
      : "";
  };
  const coverDataUrl = assetUrl("cover");
  const overviewDataUrl = assetUrl("overview");
  const scheduleDataUrl = assetUrl("schedule");
  const checklistDataUrl = assetUrl("checklist");
  const infoDataUrl = assetUrl("info");
  const memoDataUrl = assetUrl("memo");

  const generatePdf = async () => {
    setIsGenerating(true);

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert(
          "ポップアップがブロックされました。ポップアップを許可してください。",
        );
        setIsGenerating(false);
        return;
      }

      const formatDate = (date: string) => {
        if (!date) return "";
        const parsed = new Date(date);
        return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
      };

      const getPageSize = () => {
        switch (pdfSize) {
          case "a4":
            return orientation === "portrait"
              ? { width: "210mm", height: "297mm" }
              : { width: "297mm", height: "210mm" };
          case "a5":
            return orientation === "portrait"
              ? { width: "148mm", height: "210mm" }
              : { width: "210mm", height: "148mm" };
          case "bookmark":
            return { width: "55mm", height: "180mm" };
          default:
            return { width: "210mm", height: "297mm" };
        }
      };

      const pageSize = getPageSize();

      const buildPageBackground = (assetUrl: string, overlay: string) =>
        assetUrl
          ? `background-image: ${overlay}, url('${assetUrl}'); background-size: cover; background-position: center;`
          : "";
      const coverBackgroundStyle = buildPageBackground(
        coverDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.45))",
      );
      const overviewBackgroundStyle = buildPageBackground(
        overviewDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.92))",
      );
      const scheduleBackgroundStyle = buildPageBackground(
        scheduleDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.92))",
      );
      const checklistBackgroundStyle = buildPageBackground(
        checklistDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.95))",
      );
      const infoBackgroundStyle = buildPageBackground(
        infoDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.95))",
      );
      const memoBackgroundStyle = buildPageBackground(
        memoDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.98))",
      );

      const packingItems =
        trip.aiEnabled && trip.aiContent?.packingSuggestions
          ? trip.aiContent.packingSuggestions
          : [];
      const wantItems = trip.wantItems.map((item) => item.text);
      const hasChecklist = packingItems.length > 0 || wantItems.length > 0;
      const hasInfo =
        trip.lodgings.length > 0 ||
        Boolean(trip.transportText) ||
        Boolean(trip.aiContent?.cautionsText);

      const headerHtml = (title: string, subtitle?: string) => `
        <div class="page-header">
          <div>
            <div class="eyebrow">TRAVEL NOTES</div>
            <h2>${title}</h2>
            ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ""}
          </div>
          <div class="header-icon"></div>
        </div>
      `;

      const coverCopy =
        trip.aiEnabled && trip.aiContent?.coverCopy
          ? `<p class="cover-copy">"${trip.aiContent.coverCopy}"</p>`
          : "";
      const membersText = trip.members.length
        ? trip.members.map((member) => member.name).join(" ・ ")
        : "";
      const overviewText =
        trip.aiEnabled && trip.aiContent?.overviewText
          ? trip.aiContent.overviewText
          : "旅の目的や雰囲気をまとめましょう。";
      const lodgingSummary =
        trip.lodgings.length > 0
          ? trip.lodgings
              .slice(0, 2)
              .map(
                (lodging) => `
                  <div class="list-block">
                    <div class="list-title">${lodging.name}</div>
                    <div class="muted">${lodging.address || "住所未入力"}</div>
                  </div>
                `,
              )
              .join("")
          : `<p class="muted">宿泊情報を入力するとここに表示されます。</p>`;
      const cautionsText =
        trip.aiEnabled && trip.aiContent?.cautionsText
          ? trip.aiContent.cautionsText.replace(/\n/g, "<br>")
          : "";

      const renderChecklist = (items: string[], emptyText: string) => {
        if (items.length === 0) {
          return `<p class="muted">${emptyText}</p>`;
        }
        return items
          .map(
            (item) => `
              <div class="checklist-item">
                <span class="checkbox"></span>
                <span>${item}</span>
              </div>
            `,
          )
          .join("");
      };

      const pages: string[] = [];

      pages.push(`
        <section class="page cover" style="${coverBackgroundStyle}">
          <div class="cover-top">
            <div class="eyebrow">TRAVEL NOTE</div>
            <h1>${trip.title || "旅のしおり"}</h1>
            ${coverCopy}
            <div class="pill">📍 ${trip.destination || "行き先"}</div>
          </div>
          <div class="cover-bottom">
            <div class="divider"></div>
            <div class="info-grid">
              <div>📅 ${formatDate(trip.startDate)} 〜 ${formatDate(trip.endDate)}</div>
              ${membersText ? `<div>👥 ${membersText}</div>` : ""}
            </div>
          </div>
        </section>
      `);

      pages.push(`
        <section class="page" style="${overviewBackgroundStyle}">
          ${headerHtml("PLAN", "旅のプラン")}
          <div class="grid-two">
            <div class="card">
              <div class="card-title">OVERVIEW</div>
              <p>${overviewText}</p>
              <div class="meta muted">
                <div>目的地: ${trip.destination || "-"}</div>
                <div>日程: ${formatDate(trip.startDate)} 〜 ${formatDate(trip.endDate)}</div>
              </div>
            </div>
            <div class="stack">
              <div class="card">
                <div class="card-title">TRANSPORT</div>
                <p>${trip.transportText || "移動手段を入力するとここに表示されます。"}</p>
              </div>
              <div class="card">
                <div class="card-title">LODGING</div>
                ${lodgingSummary}
              </div>
            </div>
          </div>
        </section>
      `);

      trip.dayPlans.forEach((plan) => {
        const activityItems =
          plan.activities.length > 0
            ? plan.activities
                .map(
                  (activity, idx) => `
                    <div class="timeline-item">
                      <div class="timeline-dot">${idx + 1}</div>
                      <div class="timeline-text">${activity}</div>
                    </div>
                  `,
                )
                .join("")
            : `<p class="muted">予定がまだ登録されていません。</p>`;
        const summary =
          trip.aiEnabled && trip.aiContent?.daySummaries[plan.day]
            ? trip.aiContent.daySummaries[plan.day]
            : "印象に残るポイントをメモしておきましょう。";

        pages.push(`
          <section class="page" style="${scheduleBackgroundStyle}">
            ${headerHtml(`DAY ${plan.day}`, plan.date)}
            <div class="grid-schedule">
              <div class="timeline">
                ${activityItems}
              </div>
              <div class="stack">
                <div class="card">
                  <div class="card-title">HIGHLIGHTS</div>
                  <p>${summary}</p>
                </div>
                <div class="card photo-slot">
                  <div class="card-title">PHOTO SLOT</div>
                  <div class="photo-box"></div>
                </div>
              </div>
            </div>
          </section>
        `);
      });

      if (hasChecklist) {
        pages.push(`
          <section class="page" style="${checklistBackgroundStyle}">
            ${headerHtml("CHECK LIST", "持ち物・やりたいこと")}
            <div class="grid-two">
              <div class="card">
                <div class="card-title">PACKING</div>
                ${renderChecklist(packingItems, "持ち物リストがまだありません。")}
              </div>
              <div class="card">
                <div class="card-title">WISH LIST</div>
                ${renderChecklist(wantItems, "やりたいことがまだありません。")}
              </div>
            </div>
          </section>
        `);
      }

      if (hasInfo) {
        const notesText = [
          trip.transportText ? `移動: ${trip.transportText}` : "",
          cautionsText,
        ]
          .filter(Boolean)
          .join("<br>");
        pages.push(`
          <section class="page" style="${infoBackgroundStyle}">
            ${headerHtml("INFORMATION", "集合・注意事項")}
            <div class="grid-two">
              <div class="card">
                <div class="card-title">LODGING</div>
                ${lodgingSummary}
              </div>
              <div class="card">
                <div class="card-title">NOTES</div>
                ${
                  notesText
                    ? `<p>${notesText}</p>`
                    : `<p class="muted">注意事項がここに表示されます。</p>`
                }
              </div>
            </div>
          </section>
        `);
      }

      pages.push(`
        <section class="page memo" style="${memoBackgroundStyle}">
          ${headerHtml("MEMO", "自由記入スペース")}
          <div class="memo-box"></div>
        </section>
      `);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${trip.title} - 旅のしおり</title>
          <style>
            :root {
              --ink: ${theme.ink};
              --muted: ${theme.muted};
              --accent: ${theme.accent};
              --accent-soft: ${theme.accentSoft};
              --line: ${theme.line};
              --paper: ${theme.paper};
            }
            @page {
              size: ${pageSize.width} ${pageSize.height};
              margin: 0;
            }
            body {
              font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
              line-height: 1.6;
              color: var(--ink);
              margin: 0;
              padding: 0;
              background: #f5f5f5;
            }
            .page {
              page-break-after: always;
              border: 3px solid var(--line);
              border-radius: 24px;
              padding: 40px;
              width: ${pageSize.width};
              height: ${pageSize.height};
              box-sizing: border-box;
              background-color: var(--paper);
              min-height: 400px;
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .eyebrow {
              font-size: 10px;
              letter-spacing: 0.4em;
              text-transform: uppercase;
              color: var(--accent);
            }
            .page-header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              align-items: flex-start;
            }
            .page-header h2 {
              font-size: 28px;
              margin: 12px 0 0;
            }
            .subtitle {
              margin-top: 6px;
              font-size: 12px;
              color: var(--muted);
            }
            .header-icon {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 2px solid var(--line);
            }
            .grid-two {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .grid-schedule {
              display: grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: 20px;
            }
            .card {
              border: 2px dashed var(--line);
              border-radius: 20px;
              padding: 18px;
              background: rgba(255, 255, 255, 0.85);
            }
            .card-title {
              font-size: 10px;
              letter-spacing: 0.3em;
              text-transform: uppercase;
              color: var(--accent);
              margin-bottom: 10px;
            }
            .stack {
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .timeline {
              position: relative;
              padding-left: 22px;
            }
            .timeline::before {
              content: '';
              position: absolute;
              left: 6px;
              top: 0;
              bottom: 0;
              width: 1px;
              background: var(--line);
            }
            .timeline-item {
              display: flex;
              gap: 10px;
              margin-bottom: 10px;
            }
            .timeline-dot {
              width: 22px;
              height: 22px;
              border-radius: 999px;
              background: var(--accent-soft);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
            }
            .checklist-item {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              margin-bottom: 8px;
            }
            .checkbox {
              width: 12px;
              height: 12px;
              border: 1px solid var(--line);
              margin-top: 4px;
            }
            .memo-box {
              border: 2px dashed var(--line);
              border-radius: 20px;
              flex: 1;
              background-image: linear-gradient(to bottom, transparent 26px, var(--line) 27px);
              background-size: 100% 28px;
            }
            .cover {
              justify-content: space-between;
            }
            .cover h1 {
              font-size: 36px;
              margin: 16px 0 0;
            }
            .cover-copy {
              font-size: 16px;
              color: var(--muted);
              font-style: italic;
              margin-top: 12px;
            }
            .pill {
              margin-top: 16px;
              display: inline-block;
              padding: 6px 14px;
              border-radius: 999px;
              background: var(--accent-soft);
              font-size: 12px;
            }
            .divider {
              width: 60px;
              height: 2px;
              background: var(--accent);
              border-radius: 999px;
              margin-bottom: 12px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              font-size: 12px;
            }
            .muted {
              color: var(--muted);
            }
            .meta {
              margin-top: 12px;
              font-size: 12px;
              display: grid;
              gap: 6px;
            }
            .list-block {
              margin-bottom: 10px;
            }
            .list-title {
              font-weight: 600;
            }
            .photo-box {
              margin-top: 12px;
              height: 120px;
              border: 1px dashed var(--line);
              border-radius: 16px;
            }
            @media print {
              body {
                padding: 0;
                background: white;
              }
              .page {
                margin: 0;
                border-radius: 0;
                box-shadow: none;
              }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${pages.join("")}

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert("PDF生成中にエラーが発生しました。");
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-pink-300"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <FileText className="w-10 h-10 text-pink-500" />
        <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
          PDF書き出し
        </h2>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block font-bold mb-4 text-2xl">用紙サイズ</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <button
              onClick={() => setPdfSize("a4")}
              className={`p-6 border-2 rounded-2xl transition shadow-lg ${
                pdfSize === "a4"
                  ? "border-pink-500 bg-gradient-to-br from-pink-50 to-orange-50 scale-105"
                  : "border-gray-300 hover:border-pink-400 bg-white"
              }`}
              type="button"
            >
              <div className="text-5xl mb-3">📄</div>
              <div className="font-bold text-lg">A4</div>
              <div className="text-sm text-gray-600 mt-1">210×297mm</div>
            </button>
            <button
              onClick={() => setPdfSize("a5")}
              className={`p-6 border-2 rounded-2xl transition shadow-lg ${
                pdfSize === "a5"
                  ? "border-pink-500 bg-gradient-to-br from-pink-50 to-orange-50 scale-105"
                  : "border-gray-300 hover:border-pink-400 bg-white"
              }`}
              type="button"
            >
              <div className="text-5xl mb-3">📕</div>
              <div className="font-bold text-lg">A5（冊子）</div>
              <div className="text-sm text-gray-600 mt-1">148×210mm</div>
            </button>
            <button
              onClick={() => setPdfSize("bookmark")}
              className={`p-6 border-2 rounded-2xl transition shadow-lg ${
                pdfSize === "bookmark"
                  ? "border-pink-500 bg-gradient-to-br from-pink-50 to-orange-50 scale-105"
                  : "border-gray-300 hover:border-pink-400 bg-white"
              }`}
              type="button"
            >
              <div className="text-5xl mb-3">🔖</div>
              <div className="font-bold text-lg">栞サイズ</div>
              <div className="text-sm text-gray-600 mt-1">55×180mm</div>
            </button>
          </div>
        </div>

        {pdfSize !== "bookmark" && (
          <div>
            <label className="block font-bold mb-4 text-2xl">向き</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button
                onClick={() => setOrientation("portrait")}
                className={`p-6 border-2 rounded-2xl transition flex items-center justify-center gap-4 shadow-lg ${
                  orientation === "portrait"
                    ? "border-pink-500 bg-gradient-to-br from-pink-50 to-orange-50 scale-105"
                    : "border-gray-300 hover:border-pink-400 bg-white"
                }`}
                type="button"
              >
                <div className="text-5xl">📱</div>
                <div className="font-bold text-xl">縦</div>
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                className={`p-6 border-2 rounded-2xl transition flex items-center justify-center gap-4 shadow-lg ${
                  orientation === "landscape"
                    ? "border-pink-500 bg-gradient-to-br from-pink-50 to-orange-50 scale-105"
                    : "border-gray-300 hover:border-pink-400 bg-white"
                }`}
                type="button"
              >
                <div className="text-5xl">💻</div>
                <div className="font-bold text-xl">横</div>
              </button>
            </div>
          </div>
        )}

        <motion.button
          onClick={generatePdf}
          disabled={isGenerating}
          className={`w-full py-6 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 text-white rounded-2xl font-bold text-2xl flex items-center justify-center gap-4 shadow-2xl ${
            isGenerating ? "opacity-50 cursor-not-allowed" : "hover:shadow-2xl"
          }`}
          whileHover={isGenerating ? {} : { scale: 1.02 }}
          whileTap={isGenerating ? {} : { scale: 0.98 }}
          type="button"
        >
          <Download className="w-7 h-7" />
          {isGenerating ? "PDF生成中..." : "PDFを生成"}
        </motion.button>

        <motion.div
          className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-base text-gray-700 leading-relaxed">
            💡 <strong className="text-lg">ヒント:</strong>{" "}
            PDFは印刷用に最適化されています。ブラウザの印刷ダイアログが開きますので、そこからPDFとして保存できます。
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
