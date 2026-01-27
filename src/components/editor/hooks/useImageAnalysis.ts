"use client";

import { useState, useCallback, useRef } from "react";
import { AnalysisResult } from "@/lib/analysis/types";

interface UseImageAnalysisOptions {
  onSuccess?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
}

interface UseImageAnalysisReturn {
  analyze: (imageBase64: string, mimeType: string, pageMode: string, day?: number) => Promise<AnalysisResult | null>;
  retry: (imageBase64: string, mimeType: string, pageMode: string, day?: number) => Promise<AnalysisResult | null>;
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  clearResult: () => void;
  clearCache: (pageMode: string, day?: number) => void;
}

// Cache key generator
function getCacheKey(pageMode: string, day?: number): string {
  return day !== undefined ? `${pageMode}-${day}` : pageMode;
}

export function useImageAnalysis(options: UseImageAnalysisOptions = {}): UseImageAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for analysis results (persists across re-renders)
  const cacheRef = useRef<Map<string, AnalysisResult>>(new Map());

  const analyze = useCallback(
    async (
      imageBase64: string,
      mimeType: string,
      pageMode: string,
      day?: number
    ): Promise<AnalysisResult | null> => {
      const cacheKey = getCacheKey(pageMode, day);

      // Check cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setResult(cached);
        return cached;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/analyze-design", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64,
            mimeType,
            pageMode,
            day,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Analysis failed");
        }

        const analysisResult: AnalysisResult = await response.json();

        // Cache the result
        cacheRef.current.set(cacheKey, analysisResult);
        setResult(analysisResult);
        options.onSuccess?.(analysisResult);

        return analysisResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setError(message);
        options.onError?.(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const clearCache = useCallback((pageMode: string, day?: number) => {
    const cacheKey = getCacheKey(pageMode, day);
    cacheRef.current.delete(cacheKey);
  }, []);

  // Retry: clear cache and re-analyze
  const retry = useCallback(
    async (
      imageBase64: string,
      mimeType: string,
      pageMode: string,
      day?: number
    ): Promise<AnalysisResult | null> => {
      // Clear cached result first
      const cacheKey = getCacheKey(pageMode, day);
      cacheRef.current.delete(cacheKey);
      setResult(null);
      setError(null);

      // Re-run analysis
      return analyze(imageBase64, mimeType, pageMode, day);
    },
    [analyze]
  );

  return {
    analyze,
    retry,
    result,
    isLoading,
    error,
    clearResult,
    clearCache,
  };
}
