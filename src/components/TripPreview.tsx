"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { Feather } from "lucide-react";
import type { Trip } from "../types/trip";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PreviewProps {
  trip: Trip;
}

export function TripPreview({ trip }: PreviewProps) {
  const getTemplateStyles = () => {
    switch (trip.templateType) {
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
        return {
          accent: "#d35b6a",
          accentAlt: "#f4c44d",
          coverClass: "cover-pop",
        };
      case "romantic":
        return {
          accent: "#d35b6a",
          accentAlt: "#f4c44d",
          coverClass: "cover-pop",
        };
      case "modern":
        return {
          accent: "#2e3a5d",
          accentAlt: "#3f3833",
          coverClass: "cover-minimal",
        };
      case "nature":
        return {
          accent: "#7fa06a",
          accentAlt: "#4da3c7",
          coverClass: "cover-photo",
        };
      case "adventure":
        return {
          accent: "#2e3a5d",
          accentAlt: "#4da3c7",
          coverClass: "cover-minimal",
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

  const styles = getTemplateStyles();
  const sortedPages = trip.design?.pages?.length
    ? [...trip.design.pages].sort((a, b) => a.pageNumber - b.pageNumber)
    : null;
  const fullPages = sortedPages?.length ? sortedPages : null;

  return (
    <div
      className="space-y-6 template-root"
      style={
        {
          "--template-accent": styles.accent,
          "--template-accent-alt": styles.accentAlt,
        } as CSSProperties
      }
    >
      {fullPages ? (
        fullPages.map((page, index) => (
          <motion.section
            key={page.id}
            className={`paper-card template-card rounded-xl overflow-hidden ${
              index === 0 ? "template-cover" : ""
            } ${index === 0 ? styles.coverClass : ""}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.6, index * 0.08) }}
          >
            <div className="template-tab px-6 py-3">
              <h2 className="font-body font-medium flex items-center gap-2">
                <Feather className="w-5 h-5" />
                {page.label}
              </h2>
            </div>
            <div className="bg-paper-50">
              <div className="aspect-[210/297] w-full">
                <ImageWithFallback
                  src={`data:${page.mimeType};base64,${page.base64}`}
                  alt={`${trip.title} ${page.label}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </motion.section>
        ))
      ) : (
        <motion.section
          className="paper-card template-card rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="template-tab px-6 py-3">
            <h2 className="font-body font-medium flex items-center gap-2">
              <Feather className="w-5 h-5" />
              プレビュー
            </h2>
          </div>
          <div className="p-6 text-ink-soft font-body">
            デザイン画像の準備中です。もう一度開くと表示されます。
          </div>
        </motion.section>
      )}
    </div>
  );
}
