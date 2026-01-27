"use client";

import { useState, useCallback, useMemo } from "react";

interface PageEdits {
  textEdits: Map<string, string>;
}

interface EditedRegion {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  content: string;
  style: {
    fontSize: number;
    fontWeight: number;
    color: string;
    alignment: "left" | "center" | "right";
  };
}

interface AnalysisCache {
  textRegions: Array<{
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
    content: string;
    style: {
      fontSize: number;
      fontWeight: number;
      color: string;
      alignment: "left" | "center" | "right";
    };
  }>;
}

interface UsePageEditorReturn {
  pageEdits: Map<string, PageEdits>;
  updatePageText: (pageId: string, regionId: string, newContent: string) => void;
  getEditedRegions: (pageId: string) => EditedRegion[];
  hasChanges: boolean;
  clearAllEdits: () => void;
  clearPageEdits: (pageId: string) => void;
  setAnalysisCache: (pageId: string, analysis: AnalysisCache) => void;
}

export function usePageEditor(): UsePageEditorReturn {
  // Map of pageId -> PageEdits
  const [pageEdits, setPageEdits] = useState<Map<string, PageEdits>>(new Map());

  // Cache of analysis results for each page
  const [analysisCache, setAnalysisCacheState] = useState<Map<string, AnalysisCache>>(new Map());

  // Update text for a specific region on a specific page
  const updatePageText = useCallback((
    pageId: string,
    regionId: string,
    newContent: string
  ) => {
    setPageEdits((prev) => {
      const next = new Map(prev);
      const pageEdit = next.get(pageId) || { textEdits: new Map() };
      const newTextEdits = new Map(pageEdit.textEdits);

      // Get original content from analysis cache
      const analysis = analysisCache.get(pageId);
      const originalRegion = analysis?.textRegions.find(r => r.id === regionId);
      const originalContent = originalRegion?.content || "";

      // Only store if different from original
      if (newContent !== originalContent) {
        newTextEdits.set(regionId, newContent);
      } else {
        newTextEdits.delete(regionId);
      }

      next.set(pageId, { textEdits: newTextEdits });
      return next;
    });
  }, [analysisCache]);

  // Get all edited regions for a page (with full region data)
  const getEditedRegions = useCallback((pageId: string): EditedRegion[] => {
    const analysis = analysisCache.get(pageId);
    const edits = pageEdits.get(pageId);

    if (!analysis || !edits || edits.textEdits.size === 0) {
      return [];
    }

    const editedRegions: EditedRegion[] = [];

    edits.textEdits.forEach((content, regionId) => {
      const region = analysis.textRegions.find(r => r.id === regionId);
      if (region) {
        editedRegions.push({
          id: region.id,
          bounds: region.bounds,
          content,
          style: region.style,
        });
      }
    });

    return editedRegions;
  }, [analysisCache, pageEdits]);

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    const entries = Array.from(pageEdits.values());
    return entries.some(pageEdit => pageEdit.textEdits.size > 0);
  }, [pageEdits]);

  // Clear all edits
  const clearAllEdits = useCallback(() => {
    setPageEdits(new Map());
  }, []);

  // Clear edits for a specific page
  const clearPageEdits = useCallback((pageId: string) => {
    setPageEdits((prev) => {
      const next = new Map(prev);
      next.delete(pageId);
      return next;
    });
  }, []);

  // Store analysis result for a page
  const setAnalysisCache = useCallback((pageId: string, analysis: AnalysisCache) => {
    setAnalysisCacheState((prev) => {
      const next = new Map(prev);
      next.set(pageId, analysis);
      return next;
    });
  }, []);

  return {
    pageEdits,
    updatePageText,
    getEditedRegions,
    hasChanges,
    clearAllEdits,
    clearPageEdits,
    setAnalysisCache,
  };
}
