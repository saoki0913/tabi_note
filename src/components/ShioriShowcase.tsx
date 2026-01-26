"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { TemplateType } from "../types/trip";

const templateLabels: Record<TemplateType, string> = {
  minimal: "ミニマル",
  pop: "ポップ",
  photo: "写真多め",
  retro: "レトロ",
  romantic: "ロマンチック",
  modern: "モダン",
  nature: "ナチュラル",
  adventure: "アドベンチャー",
};

const sampleShioris = [
  {
    title: "ハワイ卒業旅行",
    image: "/output/_previews/ハワイ卒業旅行 - 旅のしおり.png",
    alt: "ハワイ卒業旅行のしおり",
    templateType: "pop" as TemplateType,
  },
  {
    title: "イタリア旅行",
    image: "/output/_previews/イタリア旅行 - 旅のしおり.png",
    alt: "イタリア旅行のしおり",
    templateType: "minimal" as TemplateType,
  },
  {
    title: "北海道旅行",
    image: "/output/_previews/北海道旅行 - 旅のしおり.png",
    alt: "北海道旅行のしおり",
    templateType: "photo" as TemplateType,
  },
  {
    title: "韓国旅行",
    image: "/output/_previews/韓国旅行 - 旅のしおり.png",
    alt: "韓国旅行のしおり",
    templateType: "pop" as TemplateType,
  },
  {
    title: "アメリカ旅行",
    image: "/output/_previews/アメリカ旅行 - 旅のしおり.png",
    alt: "アメリカ旅行のしおり",
    templateType: "minimal" as TemplateType,
  },
];

export function ShioriShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sampleShioris.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sampleShioris.length) % sampleShioris.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full">
      <div className="paper-card rounded-xl p-4 relative">
        <span className="tape tape-mini tape-top-left" />
        <span className="stamp-mark stamp-mini">SAMPLE</span>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full hero-badge flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-paper" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base text-ink font-bold">
              {sampleShioris[currentIndex].title}
            </h3>
            <span className="tag-pill text-[10px] px-2 py-0.5 font-ui">
              {templateLabels[sampleShioris[currentIndex].templateType]}
            </span>
          </div>
        </div>

        <div className="relative h-[340px] md:h-[400px] bg-paper-50 rounded-lg overflow-hidden shadow-inner mb-3 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="h-full flex items-center justify-center"
            >
              <ImageWithFallback
                src={sampleShioris[currentIndex].image}
                alt={sampleShioris[currentIndex].alt}
                className="h-full w-auto object-contain"
              />
            </motion.div>
          </AnimatePresence>

          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10 hover:scale-110"
            aria-label="前のしおり"
          >
            <ChevronLeft className="w-4 h-4 text-ink" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10 hover:scale-110"
            aria-label="次のしおり"
          >
            <ChevronRight className="w-4 h-4 text-ink" />
          </button>
        </div>

        <p className="text-xs text-ink-soft mb-3">
          実際にこのアプリで作成されたしおりのサンプルです。様々なスタイルで美しい旅のしおりが作れます。
        </p>

        <div className="flex items-center justify-center gap-1.5">
          {sampleShioris.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-accent-coral w-6"
                  : "bg-paper-300 hover:bg-paper-400 w-1.5"
              }`}
              aria-label={`${index + 1}番目のしおりに移動`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sampleShioris.map((shiori, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative flex-shrink-0 w-14 h-18 md:w-16 md:h-20 rounded-md overflow-hidden border-2 transition-all ${
              index === currentIndex
                ? "border-accent-coral shadow-md scale-105"
                : "border-paper-300 hover:border-paper-400 opacity-70 hover:opacity-100"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ImageWithFallback
              src={shiori.image}
              alt={shiori.alt}
              className="w-full h-full object-cover"
            />
            {index === currentIndex && (
              <div className="absolute inset-0 bg-accent-coral/10" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
