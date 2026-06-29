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
