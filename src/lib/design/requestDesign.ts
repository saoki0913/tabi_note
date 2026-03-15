import type {
  DesignMode,
  DesignRenderMode,
  Trip,
  TripDesignImage,
  TripDesignPage,
} from "@/types/trip";

export async function requestDesignAsset(
  trip: Trip,
  mode: DesignMode,
  options?: {
    pageNumber?: number;
    totalPages?: number;
    day?: number;
    renderMode?: DesignRenderMode;
    variantId?: string;
    textLines?: string[];
    styleOverride?: {
      fontFamily?: string;
      primaryColor?: string;
    };
  }
): Promise<
  TripDesignImage & {
    renderType?: "legacy" | "layered";
    textLayers?: TripDesignPage["textLayers"];
    variantId?: string;
    variantName?: string;
  }
> {
  const tripPayload: Trip = {
    ...trip,
    design: undefined,
  };

  const response = await fetch("/api/design", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trip: tripPayload,
      mode,
      renderMode: options?.renderMode ?? "full",
      pageNumber: options?.pageNumber,
      totalPages: options?.totalPages,
      day: options?.day,
      variantId: options?.variantId,
      textLines: options?.textLines,
      styleOverride: options?.styleOverride,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Design generation failed.");
  }

  const payload = (await response.json()) as {
    base64: string;
    mimeType: string;
    prompt?: string;
    mode: DesignMode;
    renderType?: "legacy" | "layered";
    textLayers?: TripDesignPage["textLayers"];
    variantId?: string;
    variantName?: string;
  };

  return {
    base64: payload.base64,
    mimeType: payload.mimeType,
    prompt: payload.prompt,
    createdAt: new Date().toISOString(),
    renderType: payload.renderType,
    textLayers: payload.textLayers,
    variantId: payload.variantId,
    variantName: payload.variantName,
  };
}
