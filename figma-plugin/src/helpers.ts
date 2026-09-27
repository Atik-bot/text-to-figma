// Small, single-purpose helper functions.
// Figma's API expects colors as {r, g, b} floats between 0 and 1 — not hex
// strings. This converts our schema's "#2563EB" style hex into that format.
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

// Applies Figma's real Auto Layout properties to a frame.
// This is what makes children stack automatically with consistent spacing,
// instead of us calculating x/y positions by hand.
export function applyAutoLayout(
  frame: FrameNode,
  direction: "horizontal" | "vertical",
  align: "start" | "center" | "end",
  padding: number,
  gap: number
): void {
  frame.layoutMode = direction === "horizontal" ? "HORIZONTAL" : "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.itemSpacing = gap;
  frame.paddingTop = padding;
  frame.paddingBottom = padding;
  frame.paddingLeft = padding;
  frame.paddingRight = padding;

  const alignMap: Record<string, "MIN" | "CENTER" | "MAX"> = {
    start: "MIN",
    center: "CENTER",
    end: "MAX",
  };
  frame.counterAxisAlignItems = alignMap[align];
}

// Converts a single sRGB channel value (0–1) to its linear-light equivalent
// using the standard IEC 61966-2-1 gamma correction formula.
function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Computes WCAG 2.x relative luminance for a hex color.
// Formula: L = 0.2126·R + 0.7152·G + 0.0722·B (after gamma correction).
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// Returns the WCAG contrast ratio between two hex colors.
// ratio = (L_lighter + 0.05) / (L_darker + 0.05), range 1–21.
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Returns textHex if it meets WCAG AA contrast (≥ 4.5) against backgroundHex.
// Otherwise returns whichever of pure black or pure white has higher contrast
// against that background — guaranteeing a readable result in all cases.
export function ensureReadableTextColor(
  textHex: string,
  backgroundHex: string
): string {
  if (getContrastRatio(textHex, backgroundHex) >= 4.5) return textHex;
  const blackContrast = getContrastRatio("#000000", backgroundHex);
  const whiteContrast = getContrastRatio("#FFFFFF", backgroundHex);
  return blackContrast >= whiteContrast ? "#000000" : "#FFFFFF";
}
