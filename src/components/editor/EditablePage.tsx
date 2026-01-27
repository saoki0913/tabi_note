"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Feather, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { TripDesignPage } from "@/types/trip";
import { TextOverlay } from "./TextOverlay";
import { useImageAnalysis } from "./hooks/useImageAnalysis";
import type { TextRegion, AnalysisResult } from "@/lib/analysis/types";

interface PageEdits {
  textEdits: Map<string, string>;
}

interface EditablePageProps {
  page: TripDesignPage;
  index: number;
  edits?: PageEdits;
  onTextUpdate: (regionId: string, newContent: string) => void;
  onAnalysisComplete?: (pageId: string, result: AnalysisResult) => void;
}

// Scanline animation duration in milliseconds
const SCANLINE_DURATION = 2500;
const REGION_REVEAL_DELAY = 100; // ms between each region reveal

export function EditablePage({
  page,
  index,
  edits,
  onTextUpdate,
  onAnalysisComplete,
}: EditablePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Scanline animation state
  const [scanlineProgress, setScanlineProgress] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  // AI image analysis
  const { analyze, retry, isLoading: isAnalyzing, error: analysisError } = useImageAnalysis({
    onSuccess: (result) => {
      setAnalysisResult(result);
      onAnalysisComplete?.(page.id, result);
      // Start region reveal animation
      startRegionReveal(result.textRegions.length);
    },
  });

  // Start scanline animation when analysis begins
  useEffect(() => {
    if (isAnalyzing) {
      setScanlineProgress(0);
      setRevealedCount(0);
      setIsRevealing(false);

      // Animate scanline from 0 to 100%
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / SCANLINE_DURATION, 1);
        setScanlineProgress(progress);

        if (progress < 1 && isAnalyzing) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isAnalyzing]);

  // Sequential region reveal animation
  const startRegionReveal = useCallback((totalRegions: number) => {
    setIsRevealing(true);
    setRevealedCount(0);

    // Reveal regions one by one
    let count = 0;
    const revealNext = () => {
      if (count < totalRegions) {
        count++;
        setRevealedCount(count);
        setTimeout(revealNext, REGION_REVEAL_DELAY);
      } else {
        setIsRevealing(false);
      }
    };
    setTimeout(revealNext, 200); // Initial delay before first reveal
  }, []);

  // Run analysis when component mounts
  useEffect(() => {
    if (page.base64 && !analysisResult) {
      analyze(page.base64, page.mimeType, page.mode, page.day);
    }
  }, [page.base64, page.mimeType, page.mode, page.day, analyze, analysisResult]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setAnalysisResult(null);
    setScanlineProgress(0);
    setRevealedCount(0);
    retry(page.base64, page.mimeType, page.mode, page.day);
  }, [retry, page.base64, page.mimeType, page.mode, page.day]);

  // Calculate scale when container or image size changes
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && imageSize.width > 0) {
        const containerWidth = containerRef.current.offsetWidth;
        setScale(containerWidth / imageSize.width);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [imageSize]);

  // Handle image load to get natural dimensions
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  }, []);

  // Get the current content for a region (edited or original)
  const getRegionContent = (region: TextRegion): string => {
    const edited = edits?.textEdits.get(region.id);
    return edited !== undefined ? edited : region.content;
  };

  // Calculate visible regions based on reveal animation
  const visibleRegions = useMemo(() => {
    if (!analysisResult) return [];
    if (!isRevealing && revealedCount === 0) {
      // After reveal animation is complete, show all
      return analysisResult.textRegions;
    }
    // During reveal, show only revealed count
    return analysisResult.textRegions.slice(0, revealedCount);
  }, [analysisResult, isRevealing, revealedCount]);

  // Handle text edit completion
  const handleEditComplete = (regionId: string, newContent: string) => {
    setEditingRegionId(null);
    onTextUpdate(regionId, newContent);
  };

  const imageSrc = `data:${page.mimeType};base64,${page.base64}`;

  return (
    <motion.section
      className="paper-card template-card rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.6, index * 0.08) }}
    >
      {/* Page header tab */}
      <div className="template-tab px-6 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-body font-medium flex items-center gap-2">
            <Feather className="w-5 h-5" />
            {page.label}
            {isAnalyzing && (
              <span className="ml-2 flex items-center gap-1 text-xs text-ink-soft">
                <Loader2 className="w-3 h-3 animate-spin" />
                テキスト検出中...
              </span>
            )}
            {isRevealing && analysisResult && (
              <span className="ml-2 text-xs text-blue-600">
                {revealedCount}/{analysisResult.textRegions.length}
              </span>
            )}
          </h2>

          {/* Retry button */}
          {!isAnalyzing && analysisResult && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs text-ink-soft hover:text-ink hover:bg-paper-100 rounded transition-colors"
              title="テキストを再検出"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              再検出
            </button>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="bg-paper-50">
        <div
          ref={containerRef}
          className="relative aspect-[210/297] w-full"
        >
          {/* Background image */}
          <img
            src={imageSrc}
            alt={`${page.label}`}
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
          />

          {/* Scanline animation during analysis */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: `${scanlineProgress * 100}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Scanline glow */}
                <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-blue-400/20" />
                {/* Main scanline */}
                <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                {/* Scan trail */}
                <div className="absolute inset-x-0 -top-20 h-20 bg-gradient-to-b from-transparent via-blue-500/5 to-blue-400/10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analysis error */}
          {analysisError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-ink-soft mb-3">{analysisError}</p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 mx-auto px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  再試行
                </button>
              </div>
            </div>
          )}

          {/* Text overlays */}
          {analysisResult && imageSize.width > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: imageSize.width,
                height: imageSize.height,
              }}
            >
              <AnimatePresence>
                {visibleRegions.map((region, idx) => (
                  <motion.div
                    key={region.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: isRevealing ? idx * 0.02 : 0 }}
                  >
                    <TextOverlay
                      region={{
                        ...region,
                        content: getRegionContent(region),
                      }}
                      isEditing={editingRegionId === region.id}
                      onStartEdit={() => setEditingRegionId(region.id)}
                      onEndEdit={(newContent) => handleEditComplete(region.id, newContent)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Page info (optional) */}
      {analysisResult && (
        <div className="px-6 py-3 bg-paper-100 border-t border-paper-200">
          <p className="text-xs text-ink-soft">
            {analysisResult.textRegions.length}個のテキスト領域を検出
            {edits?.textEdits.size ? ` • ${edits.textEdits.size}件の編集` : ""}
          </p>
        </div>
      )}
    </motion.section>
  );
}
