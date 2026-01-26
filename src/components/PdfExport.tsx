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
  retro: {
    ink: "#3f2f1e",
    muted: "#7c6a58",
    accent: "#b45309",
    accentSoft: "#fde68a",
    line: "#f59e0b",
    paper: "#fff7ed",
  },
  romantic: {
    ink: "#4b2c38",
    muted: "#9f7a8f",
    accent: "#ec4899",
    accentSoft: "#fde2e8",
    line: "#f9a8d4",
    paper: "#fff5f7",
  },
  modern: {
    ink: "#111827",
    muted: "#6b7280",
    accent: "#1f2937",
    accentSoft: "#e5e7eb",
    line: "#d1d5db",
    paper: "#f9fafb",
  },
  nature: {
    ink: "#1f2d20",
    muted: "#6b7c6e",
    accent: "#15803d",
    accentSoft: "#dcfce7",
    line: "#86efac",
    paper: "#f7fbf5",
  },
  adventure: {
    ink: "#0f2c3f",
    muted: "#5f7b8b",
    accent: "#0ea5e9",
    accentSoft: "#dbeafe",
    line: "#93c5fd",
    paper: "#f0f8ff",
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
  const sortedPages = trip.design?.pages?.length
    ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
    : null;
  const hasGeneratedPages = Boolean(sortedPages?.length);
  const renderMode =
    trip.design?.renderMode ?? (hasGeneratedPages ? "full" : "background");
  const fullPages = hasGeneratedPages ? sortedPages : null;
  const backgroundPages =
    !hasGeneratedPages && renderMode === "background" ? sortedPages : null;
  const canGenerate = Boolean(fullPages) && !isGenerating;

  const resolveBackgroundUrl = (mode: DesignMode, day?: number) => {
    if (backgroundPages) {
      if (typeof day === "number") {
        const dayMatch = backgroundPages.find(
          (page) => page.mode === mode && page.day === day,
        );
        if (dayMatch) {
          return `data:${dayMatch.mimeType};base64,${dayMatch.base64}`;
        }
      }
      const fallback = backgroundPages.find((page) => page.mode === mode);
      if (fallback) {
        return `data:${fallback.mimeType};base64,${fallback.base64}`;
      }
    }
    return assetUrl(mode);
  };

  const generatePdf = async () => {
    setIsGenerating(true);

    try {
      if (!fullPages) {
        alert(
          "デザイン画像が未生成のため、PDFを書き出せません。先にデザインを再生成してください。",
        );
        setIsGenerating(false);
        return;
      }
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
        if (Number.isNaN(parsed.getTime())) {
          return date;
        }
        return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日`;
      };

      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const formatHtmlText = (
        value: string,
        options: { preserveNewlines?: boolean } = {},
      ) => {
        const escaped = escapeHtml(value);
        return options.preserveNewlines
          ? escaped.replace(/\n/g, "<br>")
          : escaped;
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

      const coverDataUrl = resolveBackgroundUrl("cover");
      const overviewDataUrl = resolveBackgroundUrl("overview");
      const checklistDataUrl = resolveBackgroundUrl("checklist");
      const infoDataUrl = resolveBackgroundUrl("info");
      const memoDataUrl = resolveBackgroundUrl("memo");

      const buildPageBackground = (assetUrl: string | null, overlay: string) =>
        assetUrl
          ? `
            <img class="page-bg" src="${assetUrl}" alt="" />
            <div class="page-overlay" style="background: ${overlay};"></div>
          `
          : "";
      const coverBackgroundHtml = buildPageBackground(
        coverDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.45))",
      );
      const overviewBackgroundHtml = buildPageBackground(
        overviewDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.92))",
      );
      const checklistBackgroundHtml = buildPageBackground(
        checklistDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.95))",
      );
      const infoBackgroundHtml = buildPageBackground(
        infoDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.95))",
      );
      const memoBackgroundHtml = buildPageBackground(
        memoDataUrl,
        "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.98))",
      );

      if (fullPages) {
        const fullPagesHtml = fullPages
          .map(
            (page) => `
              <section class="page full">
                <img src="data:${page.mimeType};base64,${page.base64}" alt="${escapeHtml(
                  `${trip.title} ${page.label}`.trim(),
                )}" />
              </section>
            `,
          )
          .join("");

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(trip.title || "旅のしおり")} - 旅のしおり</title>
            <style>
              @page {
                size: ${pageSize.width} ${pageSize.height};
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .page {
                width: ${pageSize.width};
                height: ${pageSize.height};
                page-break-after: always;
                margin: 0;
              }
              .page:last-child {
                page-break-after: auto;
              }
              .page.full img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
                background: #fff;
              }
            </style>
          </head>
          <body>
            ${fullPagesHtml}
            <script>
              const waitForImages = () => {
                const images = Array.from(document.images);
                return Promise.all(
                  images.map((img) => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve;
                    });
                  })
                );
              };

              const waitForFonts = document.fonts ? document.fonts.ready : Promise.resolve();

              window.onload = () => {
                Promise.all([waitForImages(), waitForFonts]).then(() => {
                  setTimeout(() => {
                    window.print();
                  }, 300);
                });
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
        return;
      }

      const packingItems =
        trip.aiEnabled && trip.aiContent?.packingSuggestions
          ? trip.aiContent.packingSuggestions
          : [];
      const wantItems = trip.wantItems.map((item) => item.text);
      const hasChecklist = packingItems.length > 0 || wantItems.length > 0;
      const hasInfo =
        trip.lodgings.length > 0 ||
        Boolean(trip.transportText) ||
        Boolean(trip.aiContent?.cautionsText) ||
        Boolean(trip.notes);

      const headerHtml = (title: string, subtitle?: string) => {
        const safeTitle = formatHtmlText(title);
        const safeSubtitle = subtitle ? formatHtmlText(subtitle) : "";
        return `
          <div class="page-header">
            <div>
              <div class="eyebrow">TRAVEL NOTES</div>
              <h2>${safeTitle}</h2>
              ${safeSubtitle ? `<p class="subtitle">${safeSubtitle}</p>` : ""}
            </div>
            <div class="header-icon"></div>
          </div>
        `;
      };

      const coverCopyText =
        trip.aiEnabled && trip.aiContent?.coverCopy
          ? formatHtmlText(trip.aiContent.coverCopy)
          : "";
      const coverCopy = coverCopyText
        ? `<p class="cover-copy">&quot;${coverCopyText}&quot;</p>`
        : "";
      const membersText = trip.members.length
        ? trip.members.map((member) => formatHtmlText(member.name)).join(" ・ ")
        : "";
      const overviewText =
        trip.aiEnabled && trip.aiContent?.overviewText
          ? formatHtmlText(trip.aiContent.overviewText, {
              preserveNewlines: true,
            })
          : "旅の目的や雰囲気をまとめましょう。";
      const renderLodgingBlocks = (
        lodgings: Trip["lodgings"],
        options: { detailed?: boolean; limit?: number } = {},
      ) => {
        if (lodgings.length === 0) {
          return `<p class="muted">宿泊情報を入力するとここに表示されます。</p>`;
        }
        const limit =
          typeof options.limit === "number" ? options.limit : lodgings.length;
        return lodgings.slice(0, limit).map((lodging) => {
          const name = formatHtmlText(lodging.name || "宿泊先");
          const address = lodging.address
            ? formatHtmlText(lodging.address)
            : "住所未入力";
          const checkInOut =
            lodging.checkin || lodging.checkout
              ? `IN ${formatHtmlText(lodging.checkin || "-")} / OUT ${formatHtmlText(
                  lodging.checkout || "-",
                )}`
              : "";
          const phone = lodging.phone
            ? `TEL: ${formatHtmlText(lodging.phone)}`
            : "";
          const url = lodging.url ? formatHtmlText(lodging.url) : "";
          const memo = lodging.memo
            ? formatHtmlText(lodging.memo, { preserveNewlines: true })
            : "";
          const details = [checkInOut, phone, url, memo].filter(Boolean);
          return `
              <div class="list-block">
                <div class="list-title">${name}</div>
                <div class="muted">${address}</div>
                ${
                  options.detailed && details.length > 0
                    ? details
                        .map((detail) => `<div class="muted">${detail}</div>`)
                        .join("")
                    : ""
                }
              </div>
            `;
        }).join("");
      };
      const lodgingSummary = renderLodgingBlocks(trip.lodgings, { limit: 2 });
      const lodgingDetails = renderLodgingBlocks(trip.lodgings, {
        detailed: true,
      });
      const cautionsText =
        trip.aiEnabled && trip.aiContent?.cautionsText
          ? formatHtmlText(trip.aiContent.cautionsText, {
              preserveNewlines: true,
            })
          : "";

      const renderChecklist = (items: string[], emptyText: string) => {
        if (items.length === 0) {
          return `<p class="muted">${formatHtmlText(emptyText)}</p>`;
        }
        return items
          .map(
            (item) => `
              <div class="checklist-item">
                <span class="checkbox"></span>
                <span>${formatHtmlText(item)}</span>
              </div>
            `,
          )
          .join("");
      };

      const totalPages =
        3 +
        trip.dayPlans.length +
        (hasChecklist ? 1 : 0) +
        (hasInfo ? 1 : 0);
      const pageNumberHtml = (pageNumber: number) => `
        <div class="page-number">${pageNumber}/${totalPages}</div>
      `;
      const checklistPageNumber = 3 + trip.dayPlans.length;
      const infoPageNumber = checklistPageNumber + (hasChecklist ? 1 : 0);
      const memoPageNumber = infoPageNumber + (hasInfo ? 1 : 0);

      const pages: string[] = [];

      pages.push(`
        <section class="page cover">
          ${coverBackgroundHtml}
          <div class="page-content">
            <div class="cover-top">
              <div class="eyebrow">TRAVEL NOTE</div>
              <h1>${formatHtmlText(trip.title || "旅のしおり")}</h1>
              ${coverCopy}
              <div class="pill">📍 ${formatHtmlText(trip.destination || "行き先")}</div>
            </div>
            <div class="cover-bottom">
              <div class="divider"></div>
              <div class="info-grid">
                <div>📅 ${formatHtmlText(formatDate(trip.startDate))} 〜 ${formatHtmlText(formatDate(trip.endDate))}</div>
                ${membersText ? `<div>👥 ${membersText}</div>` : ""}
              </div>
            </div>
          </div>
          ${pageNumberHtml(1)}
        </section>
      `);

      pages.push(`
        <section class="page">
          ${overviewBackgroundHtml}
          <div class="page-content">
            ${headerHtml("PLAN", "旅のプラン")}
            <div class="grid-two">
              <div class="card">
                <div class="card-title">OVERVIEW</div>
                <p>${overviewText}</p>
                <div class="meta muted">
                  <div>目的地: ${formatHtmlText(trip.destination || "-")}</div>
                  <div>日程: ${formatHtmlText(formatDate(trip.startDate))} 〜 ${formatHtmlText(formatDate(trip.endDate))}</div>
                </div>
              </div>
              <div class="stack">
                <div class="card">
                  <div class="card-title">TRANSPORT</div>
                  <p>${trip.transportText ? formatHtmlText(trip.transportText, { preserveNewlines: true }) : "移動手段を入力するとここに表示されます。"}</p>
                </div>
                <div class="card">
                  <div class="card-title">LODGING</div>
                  ${lodgingSummary}
                </div>
              </div>
            </div>
          </div>
          ${pageNumberHtml(2)}
        </section>
      `);

      trip.dayPlans.forEach((plan, index) => {
        const scheduleBackgroundHtml = buildPageBackground(
          resolveBackgroundUrl("schedule", plan.day),
          "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.92))",
        );
        const activityItems =
          plan.activities.length > 0
            ? plan.activities
                .map(
                  (activity, idx) => `
                    <div class="timeline-item">
                      <div class="timeline-dot">${idx + 1}</div>
                      <div class="timeline-text">${formatHtmlText(activity, {
                        preserveNewlines: true,
                      })}</div>
                    </div>
                  `,
                )
                .join("")
            : `<p class="muted">予定がまだ登録されていません。</p>`;
        const summaryText =
          trip.aiEnabled && trip.aiContent?.daySummaries[plan.day]
            ? formatHtmlText(trip.aiContent.daySummaries[plan.day], {
                preserveNewlines: true,
              })
            : "印象に残るポイントをメモしておきましょう。";

        pages.push(`
          <section class="page">
            ${scheduleBackgroundHtml}
            <div class="page-content">
              ${headerHtml(`DAY ${plan.day}`, plan.date)}
              <div class="grid-schedule">
                <div class="timeline">
                  ${activityItems}
                </div>
                <div class="stack">
                  <div class="card">
                    <div class="card-title">HIGHLIGHTS</div>
                    <p>${summaryText}</p>
                  </div>
                  <div class="card photo-slot">
                    <div class="card-title">PHOTO SLOT</div>
                    <div class="photo-box"></div>
                  </div>
                </div>
              </div>
            </div>
            ${pageNumberHtml(3 + index)}
          </section>
        `);
      });

      if (hasChecklist) {
        pages.push(`
          <section class="page">
            ${checklistBackgroundHtml}
            <div class="page-content">
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
            </div>
            ${pageNumberHtml(checklistPageNumber)}
          </section>
        `);
      }

      if (hasInfo) {
        const notesSegments = [
          trip.transportText
            ? `移動: ${formatHtmlText(trip.transportText, {
                preserveNewlines: true,
              })}`
            : "",
          cautionsText,
          trip.notes
            ? formatHtmlText(trip.notes, { preserveNewlines: true })
            : "",
        ].filter(Boolean);
        const notesText = notesSegments.join("<br>");
        pages.push(`
          <section class="page">
            ${infoBackgroundHtml}
            <div class="page-content">
              ${headerHtml("INFORMATION", "集合・注意事項")}
              <div class="grid-two">
                <div class="card">
                  <div class="card-title">LODGING</div>
                  ${lodgingDetails}
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
            </div>
            ${pageNumberHtml(infoPageNumber)}
          </section>
        `);
      }

      pages.push(`
        <section class="page memo">
          ${memoBackgroundHtml}
          <div class="page-content">
            ${headerHtml("MEMO", "自由記入スペース")}
            <div class="memo-box"></div>
          </div>
          ${pageNumberHtml(memoPageNumber)}
        </section>
      `);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(trip.title || "旅のしおり")} - 旅のしおり</title>
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
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page {
              page-break-after: always;
              border: 3px solid var(--line);
              border-radius: 24px;
              width: ${pageSize.width};
              height: ${pageSize.height};
              box-sizing: border-box;
              background-color: var(--paper);
              min-height: 400px;
              position: relative;
              overflow: hidden;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .page-bg {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 0;
            }
            .page-overlay {
              position: absolute;
              inset: 0;
              z-index: 1;
            }
            .page-content {
              position: relative;
              z-index: 2;
              display: flex;
              flex-direction: column;
              gap: 24px;
              height: 100%;
              padding: 40px 40px 60px;
              box-sizing: border-box;
            }
            .page-number {
              position: absolute;
              bottom: 18px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 12px;
              color: var(--muted);
              z-index: 2;
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
            .cover .page-content {
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
              word-break: break-word;
            }
            .muted {
              color: var(--muted);
              word-break: break-word;
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
            const waitForImages = () => {
              const images = Array.from(document.images);
              return Promise.all(
                images.map((img) => {
                  if (img.complete) return Promise.resolve();
                  return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );
            };

            const waitForFonts = document.fonts ? document.fonts.ready : Promise.resolve();

            window.onload = () => {
              Promise.all([waitForImages(), waitForFonts]).then(() => {
                setTimeout(() => {
                  window.print();
                }, 300);
              });
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
          <Download className="w-8 h-8" />
          {isGenerating ? "PDF生成中..." : "PDFを生成"}
        </motion.button>

        <motion.div
          className="note-callout p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-base text-ink-soft leading-relaxed">
            💡 <strong className="text-lg text-ink">ヒント:</strong> PDFは印刷用に最適化されています。ブラウザの印刷ダイアログが開きますので、そこからPDFとして保存できます。
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
