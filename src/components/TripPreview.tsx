"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { Feather } from "lucide-react";
import type { Trip, TripDesignPage } from "../types/trip";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PreviewProps {
  trip: Trip;
  quickEdit?: {
    activePageId: string | null;
    onStartEdit: (pageId: string) => void;
    regeneratingPageId?: string | null;
  };
}

const getTemplateStyles = (templateType: Trip["templateType"]) => {
  switch (templateType) {
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
    case "romantic":
      return {
        accent: "#d35b6a",
        accentAlt: "#f4c44d",
        coverClass: "cover-pop",
      };
    case "modern":
    case "adventure":
      return {
        accent: "#2e3a5d",
        accentAlt: "#4da3c7",
        coverClass: "cover-minimal",
      };
    case "nature":
      return {
        accent: "#7fa06a",
        accentAlt: "#4da3c7",
        coverClass: "cover-photo",
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

function PreviewPage({
  page,
  trip,
  index,
  coverClass,
  quickEdit,
}: {
  page: TripDesignPage;
  trip: Trip;
  index: number;
  coverClass: string;
  quickEdit?: PreviewProps["quickEdit"];
}) {
  const isEditing = quickEdit?.activePageId === page.id;
  const isRegenerating = quickEdit?.regeneratingPageId === page.id;

  return (
    <motion.section
      className={`paper-card template-card group overflow-hidden rounded-xl ${
        index === 0 ? `template-cover ${coverClass}` : ""
      } ${isEditing ? "ring-2 ring-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]" : ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.6, index * 0.08) }}
    >
      <div className="template-tab px-6 py-3">
        <h2 className="flex items-center gap-2 font-body font-medium">
          <Feather className="h-5 w-5" />
          {page.label}
          {page.isEdited && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              修正済み
            </span>
          )}
          {isEditing && (
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
              編集中
            </span>
          )}
        </h2>
      </div>
      <div className="bg-paper-50">
        <div className="relative aspect-[210/297] w-full">
          <ImageWithFallback
            src={`data:${page.mimeType};base64,${page.base64}`}
            alt={`${trip.title} ${page.label}`}
            className="h-full w-full object-contain"
          />

          {quickEdit?.onStartEdit && (
            <button
              type="button"
              onClick={() => quickEdit.onStartEdit(page.id)}
              disabled={Boolean(quickEdit.regeneratingPageId)}
              className="absolute bottom-4 right-4 rounded-lg bg-white/90 px-3 py-1.5 text-ink shadow-md opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-60"
            >
              {isEditing ? "編集中" : "ページを修正"}
            </button>
          )}

          {isRegenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-sm text-white">再生成中...</div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export function TripPreview({ trip, quickEdit }: PreviewProps) {
  const styles = getTemplateStyles(trip.templateType);
  const pages = [...(trip.design?.pages ?? [])].sort(
    (left, right) => left.pageNumber - right.pageNumber,
  );

  return (
    <div
      className="template-root space-y-6"
      style={
        {
          "--template-accent": styles.accent,
          "--template-accent-alt": styles.accentAlt,
        } as CSSProperties
      }
    >
      {pages.length > 0 ? (
        pages.map((page, index) => (
          <PreviewPage
            key={page.id}
            page={page}
            trip={trip}
            index={index}
            coverClass={styles.coverClass}
            quickEdit={quickEdit}
          />
        ))
      ) : (
        <motion.section
          className="paper-card template-card overflow-hidden rounded-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="template-tab px-6 py-3">
            <h2 className="flex items-center gap-2 font-body font-medium">
              <Feather className="h-5 w-5" />
              プレビュー
            </h2>
          </div>
          <div className="p-6 font-body text-ink-soft">
            デザイン画像の準備中です。もう一度開くと表示されます。
          </div>
        </motion.section>
      )}
    </div>
  );
}
