import type { TextLayer } from "@/types/trip";

export function serializeTextLayersToLines(
  layers: TextLayer[],
  options?: { splitNewlines?: boolean }
): string[] {
  const splitNewlines = options?.splitNewlines ?? true;
  const sortedLayers = [...layers].sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) > Number.EPSILON) return yDiff;
    return a.position.x - b.position.x;
  });

  const lines: string[] = [];

  for (const layer of sortedLayers) {
    const content = layer.content ?? "";
    if (!content) continue;

    if (splitNewlines) {
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) lines.push(trimmed);
      });
    } else {
      const trimmed = content.trim();
      if (trimmed) lines.push(trimmed);
    }
  }

  return lines;
}
