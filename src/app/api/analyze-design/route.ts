import { NextResponse } from "next/server";
import { analyzeDesignImage } from "@/lib/analysis/analyzer";
import type { AnalysisRequest } from "@/lib/analysis/types";
import { analysisToTextLayers } from "@/lib/analysis/converter";

/**
 * POST /api/analyze-design
 *
 * Analyze a full-mode booklet page image using Gemini Vision API.
 * Extracts text regions, image slots, and converts to editable TextLayers.
 *
 * Request body:
 *   - imageBase64: string (base64-encoded image)
 *   - mimeType: string (e.g. "image/png")
 *   - pageMode: string (e.g. "cover", "schedule")
 *   - day?: number (for schedule pages)
 *
 * Response:
 *   - analysis: AnalysisResult (raw analysis data)
 *   - textLayers: TextLayer[] (converted layers for editor)
 */
export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured." },
            { status: 500 }
        );
    }

    const body = (await request.json()) as Partial<AnalysisRequest>;

    if (!body.imageBase64) {
        return NextResponse.json(
            { error: "imageBase64 is required." },
            { status: 400 }
        );
    }

    if (!body.mimeType) {
        return NextResponse.json(
            { error: "mimeType is required." },
            { status: 400 }
        );
    }

    const analysisRequest: AnalysisRequest = {
        imageBase64: body.imageBase64,
        mimeType: body.mimeType,
        pageMode: body.pageMode || "cover",
        day: body.day,
    };

    try {
        // Step 1: Analyze the image
        const analysis = await analyzeDesignImage(analysisRequest, apiKey);

        // Step 2: Convert to TextLayers
        const textLayers = analysisToTextLayers(analysis, 0.3);

        return NextResponse.json({
            analysis,
            textLayers,
        });
    } catch (error) {
        console.error("Design analysis failed:", error);
        const message =
            error instanceof Error ? error.message : "Analysis failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
