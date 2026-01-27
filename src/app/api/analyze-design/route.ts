import { NextRequest, NextResponse } from "next/server";
import {
  AnalysisResult,
  AnalysisRequest,
  TextRegion,
  ImageSlot,
  DEFAULT_ANALYSIS_IMAGE_SIZE,
  Bounds,
} from "@/lib/analysis/types";

// Use Gemini for vision analysis (configurable via env)
// Supported models: gemini-2.5-flash, gemini-2.5-pro, gemini-3-pro-preview
const MODEL_ID = process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

// Minimum confidence threshold for text detection
const MIN_CONFIDENCE = 0.7;

const ANALYSIS_PROMPT = `You are analyzing a JAPANESE travel bookmark page (旅行のしおり) image.

IMAGE DIMENSIONS: ${DEFAULT_ANALYSIS_IMAGE_SIZE.width}x${DEFAULT_ANALYSIS_IMAGE_SIZE.height} pixels (A4 at 300 DPI)

=== CRITICAL INSTRUCTIONS ===

1. JAPANESE TEXT DETECTION (日本語テキスト検出):
   - This image contains JAPANESE TEXT (日本語). You MUST accurately detect ALL Japanese characters including:
     - Hiragana (ひらがな)
     - Katakana (カタカナ)
     - Kanji (漢字)
     - Japanese punctuation (。、「」・)
     - Mixed Japanese/English text
   - Read each text region carefully and transcribe EXACTLY what you see
   - Do NOT guess or infer text - only report what is clearly visible

2. BOUNDING BOX PRECISION:
   - Bounding boxes must TIGHTLY wrap the text with only 2-4 pixels of padding
   - Do NOT include excessive whitespace around text
   - x, y = top-left corner position in pixels
   - width, height = exact dimensions to wrap the text

3. CONFIDENCE SCORING:
   - Only return regions with confidence >= 0.7
   - confidence = how certain you are about the text content accuracy
   - 0.9-1.0: Text is crystal clear, 100% readable
   - 0.7-0.9: Text is readable but may have minor uncertainty
   - Below 0.7: Do NOT include in results

4. NO OVERLAPPING REGIONS:
   - Each text element should be in ONE region only
   - If multiple lines are grouped together, treat as one region with newlines
   - Do NOT create duplicate regions for the same text

5. ZONE TYPE CLASSIFICATION:
   - "title": Main heading (largest text, usually trip name)
   - "subtitle": Secondary heading (section titles)
   - "body": Paragraph or description text
   - "date": Dates, times, schedules (e.g., "2024年1月1日", "Day 1")
   - "members": Names of people (e.g., "田中・山田・佐藤")
   - "list-item": Bulleted or numbered items (e.g., "1. 東京駅集合")
   - "caption": Small descriptive text
   - "label": Field labels (e.g., "目的地：", "日程：")

=== OUTPUT FORMAT ===

Return ONLY valid JSON (no markdown, no explanation):

{
  "textRegions": [
    {
      "id": "text-1",
      "bounds": {"x": 100, "y": 200, "width": 500, "height": 80},
      "content": "京都旅行",
      "style": {"fontSize": 72, "fontWeight": 700, "color": "#1a1a2e", "alignment": "center"},
      "zoneType": "title",
      "confidence": 0.95
    },
    {
      "id": "text-2",
      "bounds": {"x": 150, "y": 300, "width": 400, "height": 40},
      "content": "2024年3月15日〜17日",
      "style": {"fontSize": 24, "fontWeight": 400, "color": "#666666", "alignment": "center"},
      "zoneType": "date",
      "confidence": 0.92
    }
  ],
  "imageSlots": []
}

=== CHECKLIST BEFORE RETURNING ===
□ All Japanese text accurately transcribed?
□ Bounding boxes tight (2-4px padding only)?
□ All confidence scores >= 0.7?
□ No overlapping/duplicate regions?
□ Zone types correctly classified?
□ Output is valid JSON only?`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: "CONFIG_ERROR", message: "Gemini API key not configured" } },
        { status: 500 }
      );
    }

    const body: AnalysisRequest = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Missing image data" } },
        { status: 400 }
      );
    }

    // Call Gemini API with vision capability
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: ANALYSIS_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: { code: "API_ERROR", message: "Gemini API request failed" } },
        { status: response.status }
      );
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(
        { error: { code: "EMPTY_RESPONSE", message: "No response from Gemini" } },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let analysisData: { textRegions: TextRegion[]; imageSlots: ImageSlot[] };

    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      analysisData = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: { code: "PARSE_ERROR", message: "Failed to parse analysis result" } },
        { status: 500 }
      );
    }

    // Validate, sanitize, and filter the results
    const pageWidth = DEFAULT_ANALYSIS_IMAGE_SIZE.width;
    const pageHeight = DEFAULT_ANALYSIS_IMAGE_SIZE.height;

    // Helper: Clamp bounds to page dimensions
    const clampBounds = (b: Bounds): Bounds => ({
      x: Math.max(0, Math.min(b.x, pageWidth - 10)),
      y: Math.max(0, Math.min(b.y, pageHeight - 10)),
      width: Math.max(10, Math.min(b.width, pageWidth - b.x)),
      height: Math.max(10, Math.min(b.height, pageHeight - b.y)),
    });

    // Helper: Calculate IoU (Intersection over Union) for overlap detection
    const calculateIoU = (a: Bounds, b: Bounds): number => {
      const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
      const intersection = xOverlap * yOverlap;
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      const union = areaA + areaB - intersection;
      return union > 0 ? intersection / union : 0;
    };

    // Helper: Merge two bounds into one
    const mergeBounds = (a: Bounds, b: Bounds): Bounds => ({
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      width: Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x),
      height: Math.max(a.y + a.height, b.y + b.height) - Math.min(a.y, b.y),
    });

    // Step 1: Parse and validate all regions
    const rawRegions: TextRegion[] = (analysisData.textRegions || []).map((r, i) => ({
      id: r.id || `text-${i + 1}`,
      bounds: clampBounds({
        x: r.bounds?.x || 0,
        y: r.bounds?.y || 0,
        width: r.bounds?.width || 100,
        height: r.bounds?.height || 30,
      }),
      content: r.content || "",
      style: {
        fontSize: r.style?.fontSize || 24,
        fontWeight: r.style?.fontWeight || 400,
        color: r.style?.color || "#1a1a2e",
        alignment: r.style?.alignment || "left",
      },
      zoneType: r.zoneType || "body",
      confidence: Math.min(1, Math.max(0, r.confidence || 0.5)),
    }));

    // Step 2: Filter by confidence threshold
    const confidentRegions = rawRegions.filter(r => r.confidence >= MIN_CONFIDENCE);

    // Step 3: Merge overlapping regions (IoU > 0.5)
    const mergedRegions: TextRegion[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < confidentRegions.length; i++) {
      if (processed.has(i)) continue;

      let current = confidentRegions[i];
      processed.add(i);

      // Find and merge overlapping regions
      for (let j = i + 1; j < confidentRegions.length; j++) {
        if (processed.has(j)) continue;

        const other = confidentRegions[j];
        const iou = calculateIoU(current.bounds, other.bounds);

        if (iou > 0.5) {
          // Merge: combine bounds, keep higher confidence region's content
          current = {
            ...current,
            bounds: mergeBounds(current.bounds, other.bounds),
            content: current.confidence >= other.confidence ? current.content : other.content,
            confidence: Math.max(current.confidence, other.confidence),
          };
          processed.add(j);
        }
      }

      mergedRegions.push(current);
    }

    // Step 4: Sort by position (top-to-bottom, left-to-right)
    const textRegions = mergedRegions.sort((a, b) => {
      const yDiff = a.bounds.y - b.bounds.y;
      return Math.abs(yDiff) > 50 ? yDiff : a.bounds.x - b.bounds.x;
    });

    // Process image slots (with confidence filtering)
    const imageSlots: ImageSlot[] = (analysisData.imageSlots || [])
      .map((s, i) => ({
        id: s.id || `img-${i + 1}`,
        bounds: clampBounds({
          x: s.bounds?.x || 0,
          y: s.bounds?.y || 0,
          width: s.bounds?.width || 100,
          height: s.bounds?.height || 100,
        }),
        type: s.type || "thumbnail",
        isEmpty: s.isEmpty ?? true,
        shape: s.shape || "rectangle",
        confidence: Math.min(1, Math.max(0, s.confidence || 0.5)),
      }))
      .filter(s => s.confidence >= MIN_CONFIDENCE);

    const analysisResult: AnalysisResult = {
      textRegions,
      imageSlots,
      pageSize: DEFAULT_ANALYSIS_IMAGE_SIZE,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: {
          code: "ANALYSIS_FAILED",
          message: error instanceof Error ? error.message : "Analysis failed",
        },
      },
      { status: 500 }
    );
  }
}
