/**
 * Image Analysis using Gemini Vision API
 *
 * Analyzes a full-mode booklet page image and extracts structured
 * text regions, image slots, and layout information.
 */

import type { AnalysisResult, TextRegion, ImageSlot, AnalysisRequest } from "./types";

const MODEL_ID = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

/**
 * Build the analysis prompt for Gemini Vision API.
 * Instructs the model to return structured JSON with text regions and image slots.
 */
function buildAnalysisPrompt(pageMode: string): string {
  return `You are a design analysis engine. Analyze this travel booklet page image and extract all visual elements as structured data.

TASK: Identify every text element and decorative/image area in this ${pageMode} page.

For EACH text element found, return:
- id: unique identifier (e.g. "text_1", "text_2")
- bounds: { x, y, width, height } in pixels relative to the image dimensions
- content: the exact text string (preserve Japanese characters exactly)
- style:
  - fontSize: estimated font size in pixels
  - fontWeight: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  - color: hex color string (e.g. "#1a1a2e")
  - alignment: "left" | "center" | "right"
- zoneType: classify as one of: "title", "subtitle", "body", "date", "members", "list-item", "caption", "label"
- confidence: 0.0 to 1.0 (how confident you are in the detection)

For EACH decorative/image area found, return:
- id: unique identifier (e.g. "img_1", "slot_1")
- bounds: { x, y, width, height } in pixels
- type: "hero" | "thumbnail" | "icon"
- isEmpty: boolean (true if the area appears to be empty/placeholder)
- shape: "rectangle" | "circle" | "rounded"
- confidence: 0.0 to 1.0

IMPORTANT:
- Report coordinates in the original image pixel space
- Be precise with bounds — they should tightly wrap each text element
- Preserve Japanese text exactly as rendered (don't translate or modify)
- Include ALL text, even small labels and page numbers
- For list items (numbered, bulleted), treat each item as a separate text region

Return ONLY valid JSON in this exact format:
{
  "textRegions": [ ... ],
  "imageSlots": [ ... ],
  "pageSize": { "width": <image_width>, "height": <image_height> }
}`;
}

/**
 * Parse the Gemini API response to extract the JSON analysis result.
 */
function parseAnalysisResponse(responseText: string): AnalysisResult {
  // Try to extract JSON from the response text
  // The model might wrap JSON in markdown code blocks
  let jsonStr = responseText.trim();

  // Remove markdown code block if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate the basic structure
  if (!parsed.textRegions || !Array.isArray(parsed.textRegions)) {
    throw new Error("Invalid analysis result: missing textRegions array");
  }
  if (!parsed.pageSize || typeof parsed.pageSize.width !== "number") {
    throw new Error("Invalid analysis result: missing or invalid pageSize");
  }

  // Ensure all text regions have required fields
  const textRegions: TextRegion[] = parsed.textRegions.map(
    (region: Record<string, unknown>, index: number) => ({
      id: (region.id as string) || `text_${index + 1}`,
      bounds: {
        x: Number((region.bounds as Record<string, unknown>)?.x) || 0,
        y: Number((region.bounds as Record<string, unknown>)?.y) || 0,
        width: Number((region.bounds as Record<string, unknown>)?.width) || 100,
        height: Number((region.bounds as Record<string, unknown>)?.height) || 30,
      },
      content: String(region.content || ""),
      style: {
        fontSize: Number((region.style as Record<string, unknown>)?.fontSize) || 16,
        fontWeight: Number((region.style as Record<string, unknown>)?.fontWeight) || 400,
        color: String((region.style as Record<string, unknown>)?.color || "#1a1a2e"),
        alignment:
          (region.style as Record<string, unknown>)?.alignment === "center"
            ? "center"
            : (region.style as Record<string, unknown>)?.alignment === "right"
              ? "right"
              : "left",
      },
      zoneType: String(region.zoneType || "body") as TextRegion["zoneType"],
      confidence: Number(region.confidence) || 0.5,
    })
  );

  // Parse image slots (optional)
  const imageSlots: ImageSlot[] = Array.isArray(parsed.imageSlots)
    ? parsed.imageSlots.map(
        (slot: Record<string, unknown>, index: number) => ({
          id: (slot.id as string) || `img_${index + 1}`,
          bounds: {
            x: Number((slot.bounds as Record<string, unknown>)?.x) || 0,
            y: Number((slot.bounds as Record<string, unknown>)?.y) || 0,
            width: Number((slot.bounds as Record<string, unknown>)?.width) || 100,
            height: Number((slot.bounds as Record<string, unknown>)?.height) || 100,
          },
          type: (slot.type as ImageSlot["type"]) || "thumbnail",
          isEmpty: Boolean(slot.isEmpty),
          shape: (slot.shape as ImageSlot["shape"]) || "rectangle",
          confidence: Number(slot.confidence) || 0.5,
        })
      )
    : [];

  return {
    textRegions,
    imageSlots,
    pageSize: {
      width: Number(parsed.pageSize.width),
      height: Number(parsed.pageSize.height),
    },
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Analyze a booklet page image using Gemini Vision API.
 *
 * @param request - The analysis request containing image data and metadata
 * @param apiKey - Gemini API key
 * @returns Structured analysis result with text regions and image slots
 */
export async function analyzeDesignImage(
  request: AnalysisRequest,
  apiKey: string
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(request.pageMode);

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
            {
              inlineData: {
                mimeType: request.mimeType,
                data: request.imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for structured output
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini Vision API request failed (${response.status}): ${errorText}`
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

  const textPart = json.candidates?.[0]?.content?.parts?.find(
    (part) => part.text
  );

  if (!textPart?.text) {
    throw new Error("Gemini Vision API returned no text response");
  }

  return parseAnalysisResponse(textPart.text);
}
