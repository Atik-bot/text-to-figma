import { SectionNode, DesignTokens, DesignSchema } from "./types";
import { hexToRgb, applyAutoLayout } from "./helpers";
import { buildComponent } from "./components";

// Builds one section (hero / features / footer) as a Figma frame with
// auto layout, then appends every child component defined in the schema.
function buildSection(section: SectionNode, tokens: DesignTokens): FrameNode {
  const frame = figma.createFrame();
  frame.name = `Section: ${section.variant}`;

  const paddingValue = tokens.spacing[section.layout.padding] ?? 64;
  const gapValue = tokens.spacing[section.layout.gap] ?? 16;

  applyAutoLayout(
    frame,
    section.layout.direction,
    section.layout.align,
    paddingValue,
    gapValue
  );

  for (const componentData of section.children) {
    const node = buildComponent(componentData, tokens);
    frame.appendChild(node);
  }

  return frame;
}

// The top-level entry point: builds the entire page frame containing
// every section, in order, and places it on the current Figma page.
export function buildPage(schema: DesignSchema): FrameNode {
  const pageFrame = figma.createFrame();
  pageFrame.name = schema.page.name;
  pageFrame.resize(schema.page.frame.width, pageFrame.height);

  pageFrame.layoutMode = "VERTICAL";
  pageFrame.primaryAxisSizingMode = "AUTO";
  pageFrame.counterAxisSizingMode = "FIXED";
  pageFrame.itemSpacing = 0;

  const bgHex =
    schema.designTokens.colors[schema.page.frame.background] ?? "#FFFFFF";
  pageFrame.fills = [{ type: "SOLID", color: hexToRgb(bgHex) }];

  for (const sectionData of schema.page.frame.sections) {
    const sectionFrame = buildSection(sectionData, schema.designTokens);
    pageFrame.appendChild(sectionFrame);
    // FILL sizing can only be set after the child is attached to an auto-layout parent.
    sectionFrame.layoutSizingHorizontal = "FILL";
  }

  figma.currentPage.appendChild(pageFrame);
  return pageFrame;
}
