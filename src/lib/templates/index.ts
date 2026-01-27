import { DesignMode, TemplateType, FormatType } from "@/types/trip";
import { TemplateDefinition, TemplateRegistry, mergeTemplate } from "./types";
import { baseTemplates, getBaseTemplate } from "./base";
import { formatModifiers, getFormatModifier } from "./formats";
import { pageLayouts, getPageLayout } from "./pages";

// Export all types
export * from "./types";

// Export individual accessors
export { getBaseTemplate } from "./base";
export { getFormatModifier } from "./formats";
export { getPageLayout } from "./pages";

// Full template registry
export const templateRegistry: TemplateRegistry = {
  bases: baseTemplates,
  formats: formatModifiers,
  pages: pageLayouts,
};

// Get a complete template definition for a specific combination
export function getTemplateDefinition(
  templateType: TemplateType,
  formatType: FormatType,
  pageMode: DesignMode
): TemplateDefinition {
  const base = getBaseTemplate(templateType);
  const format = getFormatModifier(formatType);
  const layout = getPageLayout(pageMode);

  return mergeTemplate(base, format, layout);
}

// Get all available template types
export function getAvailableTemplateTypes(): TemplateType[] {
  return Object.keys(baseTemplates) as TemplateType[];
}

// Get all available format types
export function getAvailableFormatTypes(): FormatType[] {
  return Object.keys(formatModifiers) as FormatType[];
}

// Get all available page modes
export function getAvailablePageModes(): DesignMode[] {
  return Object.keys(pageLayouts) as DesignMode[];
}
