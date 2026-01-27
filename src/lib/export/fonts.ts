/**
 * Font loading utilities for server-side rendering with Satori
 *
 * Handles loading Google Fonts as ArrayBuffers for use in Satori's font system.
 * Fonts are cached in memory to avoid repeated network requests.
 */

// Font weight type
export type FontWeight = 400 | 500 | 600 | 700;

// Font data structure for Satori
export interface FontData {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight;
  style: "normal" | "italic";
}

// Google Fonts API base URL
const GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2";

// Font configuration
export interface FontConfig {
  family: string;
  weights: FontWeight[];
  googleFontName?: string; // Override for Google Fonts API (e.g., "Zen+Kaku+Gothic+New")
}

// Default fonts for the shiori app
export const DEFAULT_FONT_CONFIGS: FontConfig[] = [
  {
    family: "Zen Kaku Gothic New",
    weights: [400, 500, 700],
    googleFontName: "Zen+Kaku+Gothic+New",
  },
  {
    family: "Cormorant Garamond",
    weights: [400, 500, 600, 700],
    googleFontName: "Cormorant+Garamond",
  },
  {
    family: "DM Sans",
    weights: [400, 500, 700],
    googleFontName: "DM+Sans",
  },
];

// In-memory font cache
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Get cache key for a specific font variant
 */
function getFontCacheKey(family: string, weight: FontWeight): string {
  return `${family}-${weight}`;
}

/**
 * Parse CSS @font-face rules to extract font URLs
 */
function parseFontUrls(css: string): Map<number, string> {
  const urls = new Map<number, string>();

  // Match font-face rules
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = fontFaceRegex.exec(css)) !== null) {
    const content = match[1];

    // Extract weight
    const weightMatch = content.match(/font-weight:\s*(\d+)/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : 400;

    // Extract URL (prefer woff2)
    const urlMatch = content.match(/url\(([^)]+\.woff2[^)]*)\)/);
    if (urlMatch) {
      // Clean up the URL
      const url = urlMatch[1].replace(/['"]/g, "");
      urls.set(weight, url);
    }
  }

  return urls;
}

/**
 * Fetch font CSS from Google Fonts API
 */
async function fetchGoogleFontCSS(
  fontName: string,
  weights: FontWeight[]
): Promise<string> {
  const weightsStr = weights.join(";");
  const url = `${GOOGLE_FONTS_API}?family=${fontName}:wght@${weightsStr}&display=swap`;

  const response = await fetch(url, {
    headers: {
      // Request woff2 format
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch font CSS: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Fetch font file as ArrayBuffer
 */
async function fetchFontFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch font file: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Load a single font family with specified weights
 */
export async function loadFont(config: FontConfig): Promise<FontData[]> {
  const fontName = config.googleFontName || config.family.replace(/\s+/g, "+");
  const fonts: FontData[] = [];

  try {
    // Check cache first
    const uncachedWeights: FontWeight[] = [];
    for (const weight of config.weights) {
      const cacheKey = getFontCacheKey(config.family, weight);
      const cached = fontCache.get(cacheKey);
      if (cached) {
        fonts.push({
          name: config.family,
          data: cached,
          weight,
          style: "normal",
        });
      } else {
        uncachedWeights.push(weight);
      }
    }

    // If all weights are cached, return early
    if (uncachedWeights.length === 0) {
      return fonts;
    }

    // Fetch CSS for uncached weights
    const css = await fetchGoogleFontCSS(fontName, uncachedWeights);
    const fontUrls = parseFontUrls(css);

    // Fetch font files
    await Promise.all(
      uncachedWeights.map(async (weight) => {
        const url = fontUrls.get(weight);
        if (!url) {
          console.warn(`No URL found for ${config.family} weight ${weight}`);
          return;
        }

        try {
          const data = await fetchFontFile(url);

          // Cache the font
          const cacheKey = getFontCacheKey(config.family, weight);
          fontCache.set(cacheKey, data);

          fonts.push({
            name: config.family,
            data,
            weight,
            style: "normal",
          });
        } catch (err) {
          console.error(`Failed to load ${config.family} weight ${weight}:`, err);
        }
      })
    );

    return fonts;
  } catch (err) {
    console.error(`Failed to load font family ${config.family}:`, err);
    return fonts;
  }
}

/**
 * Load all default fonts for the shiori app
 */
export async function loadDefaultFonts(): Promise<FontData[]> {
  const fontPromises = DEFAULT_FONT_CONFIGS.map(loadFont);
  const results = await Promise.all(fontPromises);
  return results.flat();
}

/**
 * Load specific fonts by family names
 */
export async function loadFonts(families: string[]): Promise<FontData[]> {
  const configs = families
    .map((family) =>
      DEFAULT_FONT_CONFIGS.find((c) => c.family === family)
    )
    .filter((c): c is FontConfig => c !== undefined);

  if (configs.length === 0) {
    console.warn("No matching font configs found, loading defaults");
    return loadDefaultFonts();
  }

  const fontPromises = configs.map(loadFont);
  const results = await Promise.all(fontPromises);
  return results.flat();
}

/**
 * Clear font cache (useful for testing or memory management)
 */
export function clearFontCache(): void {
  fontCache.clear();
}

/**
 * Get current cache size
 */
export function getFontCacheSize(): number {
  return fontCache.size;
}
