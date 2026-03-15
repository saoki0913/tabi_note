/**
 * Converter: AnalysisResult → TextLayer[]
 *
 * Converts Gemini Vision API analysis results (pixel-space TextRegions)
 * into normalized TextLayer objects compatible with the layered editor.
 */

import type { TextLayer, TextLayerStyle, ZoneType } from "@/types/trip";
import type { TextRegion, AnalysisResult, Bounds } from "./types";
import { CANVAS_HEIGHT } from "@/types/editor";

/**
 * Map analysis zoneType to trip ZoneType.
 * The analysis uses the same zone type taxonomy.
 */
function mapZoneType(analysisZone: TextRegion["zoneType"]): ZoneType {
    const mapping: Record<string, ZoneType> = {
        title: "title",
        subtitle: "subtitle",
        body: "body",
        date: "date",
        members: "members",
        "list-item": "list-item",
        caption: "caption",
        label: "label",
    };
    return mapping[analysisZone] ?? "body";
}

/**
 * Normalize pixel bounds to 0-1 coordinates relative to page size.
 */
function normalizeBounds(
    bounds: Bounds,
    pageWidth: number,
    pageHeight: number
): { position: { x: number; y: number }; size: { width: number; height: number } } {
    return {
        position: {
            x: Math.max(0, Math.min(1, bounds.x / pageWidth)),
            y: Math.max(0, Math.min(1, bounds.y / pageHeight)),
        },
        size: {
            width: Math.max(0.01, Math.min(1, bounds.width / pageWidth)),
            height: Math.max(0.01, Math.min(1, bounds.height / pageHeight)),
        },
    };
}

/**
 * Estimate a reasonable fontSize for layered rendering.
 * Scales from the analysis image space to canvas space (595×842).
 */
function scaleToCanvasFontSize(
    analysisFontSize: number,
    analysisPageHeight: number
): number {
    const scale = CANVAS_HEIGHT / analysisPageHeight;
    const scaled = analysisFontSize * scale;
    // Clamp to reasonable range
    return Math.max(8, Math.min(72, Math.round(scaled)));
}

/**
 * Build a TextLayerStyle from a TextRegion's style info.
 */
function buildStyle(
    region: TextRegion,
    analysisPageHeight: number
): TextLayerStyle {
    const fontSize = scaleToCanvasFontSize(
        region.style.fontSize,
        analysisPageHeight
    );

    return {
        fontSize,
        fontFamily: "Zen Kaku Gothic New", // Default; user can change in editor
        fontWeight: region.style.fontWeight,
        color: region.style.color,
        alignment: region.style.alignment,
        lineHeight: region.zoneType === "title" ? 1.3 : 1.5,
    };
}

/**
 * Convert an AnalysisResult into an array of TextLayer objects
 * suitable for the layered page editor.
 *
 * @param analysis - The structured analysis from Gemini Vision
 * @param minConfidence - Minimum confidence threshold (0-1). Default: 0.3
 * @returns Array of TextLayer objects with normalized coordinates
 */
export function analysisToTextLayers(
    analysis: AnalysisResult,
    minConfidence = 0.3
): TextLayer[] {
    const { textRegions, pageSize } = analysis;

    // Filter by confidence
    const filtered = textRegions.filter(
        (region) => region.confidence >= minConfidence
    );

    // Sort by vertical position (top to bottom), then horizontal
    const sorted = [...filtered].sort((a, b) => {
        const dy = a.bounds.y - b.bounds.y;
        if (Math.abs(dy) > 20) return dy; // Different row
        return a.bounds.x - b.bounds.x; // Same row, left to right
    });

    return sorted.map((region, index) => {
        const normalized = normalizeBounds(
            region.bounds,
            pageSize.width,
            pageSize.height
        );

        return {
            id: `analyzed_${region.id || index}`,
            zoneType: mapZoneType(region.zoneType),
            content: region.content,
            position: normalized.position,
            size: normalized.size,
            style: buildStyle(region, pageSize.height),
            opacity: 1,
            locked: false,
            isUserAdded: false,
        };
    });
}

/**
 * Merge analysis-derived text layers with existing editableTextLines
 * when available, preferring user-edited content over analyzed content.
 */
export function mergeWithExistingContent(
    analyzedLayers: TextLayer[],
    existingContent?: string[]
): TextLayer[] {
    if (!existingContent || existingContent.length === 0) {
        return analyzedLayers;
    }

    // If we have existing content, try to match by content similarity
    // and prefer the existing (possibly user-edited) version
    return analyzedLayers.map((layer) => {
        const match = existingContent.find(
            (content) =>
                content.includes(layer.content) || layer.content.includes(content)
        );
        if (match) {
            return { ...layer, content: match };
        }
        return layer;
    });
}
