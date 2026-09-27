import { ComponentNode, DesignTokens } from "./types";
import { hexToRgb, applyAutoLayout, ensureReadableTextColor } from "./helpers";

// Tracks font families that failed to load during loadFonts(). Any family in
// this set gets substituted with "Inter" when a text node is created.
// Module-level so createTextNode() can read it without threading it through
// every call in the component tree.
const _failedFamilies = new Set<string>();

// Loads every font family referenced in the schema's typography tokens, plus
// Inter unconditionally as the safe fallback. Each (family, style) pair is
// attempted individually — if any style for a given family fails, that family
// is flagged and all nodes using it will render in Inter instead.
export async function loadFonts(
  typography: DesignTokens["typography"]
): Promise<void> {
  _failedFamilies.clear();

  // Inter is always loaded — it's the guaranteed fallback.
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });

  // Collect the unique font families the schema actually uses.
  const families = new Set<string>(
    Object.values(typography).map((t) => t.fontFamily)
  );
  families.delete("Inter"); // already loaded above

  const styles = ["Regular", "Bold", "Semi Bold"] as const;

  for (const family of families) {
    for (const style of styles) {
      try {
        await figma.loadFontAsync({ family, style });
      } catch {
        console.warn(
          `loadFonts: "${family}" ${style} unavailable in this Figma instance — falling back to Inter`
        );
        _failedFamilies.add(family);
      }
    }
  }
}

// Creates a single text node and applies a named typography style + color
// from our design tokens. parentBgHex is the actual background color the text
// will render on — used to guarantee WCAG AA contrast (≥ 4.5).
function createTextNode(
  content: string,
  styleName: string,
  colorName: string,
  tokens: DesignTokens,
  parentBgHex: string
): TextNode {
  const node = figma.createText();
  const typeStyle = tokens.typography[styleName] ?? tokens.typography.body;

  // Figma needs a numeric weight mapped to an actual font style string.
  const weightToStyle =
    typeStyle.fontWeight >= 700
      ? "Bold"
      : typeStyle.fontWeight >= 600
      ? "Semi Bold"
      : "Regular";

  // If the requested family failed to load, substitute Inter so the node
  // creation always succeeds rather than throwing.
  const family = _failedFamilies.has(typeStyle.fontFamily)
    ? "Inter"
    : typeStyle.fontFamily;

  node.fontName = { family, style: weightToStyle };
  node.fontSize = typeStyle.fontSize;
  node.characters = content;

  const rawHex = tokens.colors[colorName] ?? tokens.colors["textPrimary"] ?? "#000000";
  const safeHex = ensureReadableTextColor(rawHex, parentBgHex);
  if (safeHex !== rawHex) {
    console.warn(
      `contrast: "${content}" color corrected ${rawHex} → ${safeHex} (bg ${parentBgHex})`
    );
  }
  node.fills = [{ type: "SOLID", color: hexToRgb(safeHex) }];

  return node;
}

// Creates a button: a frame with auto layout hugging a single text label,
// with a filled background and rounded corners — mirroring a real button.
function createButtonNode(
  label: string,
  tokens: DesignTokens
): FrameNode {
  const button = figma.createFrame();
  button.name = `Button: ${label}`;
  applyAutoLayout(button, "horizontal", "center", 16, 8);
  button.cornerRadius = 8;
  const buttonBgHex = tokens.colors["primary"] ?? "#000000";
  button.fills = [
    { type: "SOLID", color: hexToRgb(buttonBgHex) },
  ];

  // Button label is checked against the button's own fill color, not the page bg.
  const text = createTextNode(label, "body", "background", tokens, buttonBgHex);
  button.appendChild(text);

  return button;
}

// Creates a card: a vertically stacked frame with a title and description —
// used inside the "features" section.
function createCardNode(
  title: string,
  description: string,
  tokens: DesignTokens
): FrameNode {
  const card = figma.createFrame();
  card.name = `Card: ${title}`;
  applyAutoLayout(card, "vertical", "start", 24, 12);
  const cardBgHex = tokens.colors["surface"] ?? "#FFFFFF";
  card.fills = [{ type: "SOLID", color: hexToRgb(cardBgHex) }];
  card.cornerRadius = 12;
  card.resize(280, card.height);

  const titleNode = createTextNode(title, "subheading", "textPrimary", tokens, cardBgHex);
  const descNode = createTextNode(description, "body", "textSecondary", tokens, cardBgHex);
  descNode.resize(232, descNode.height);
  descNode.textAutoResize = "HEIGHT";

  card.appendChild(titleNode);
  card.appendChild(descNode);

  return card;
}

// Creates a pricing card: a vertically stacked frame with a plan title,
// price string, a list of features, and a CTA button — reusing createButtonNode
// so the button style stays consistent with the rest of the design.
function createPricingCardNode(
  component: ComponentNode,
  tokens: DesignTokens
): FrameNode {
  const card = figma.createFrame();
  card.name = `PricingCard: ${component.title ?? ""}`;
  applyAutoLayout(card, "vertical", "center", 24, 12);
  const cardBgHex = tokens.colors["surface"] ?? "#FFFFFF";
  card.fills = [{ type: "SOLID", color: hexToRgb(cardBgHex) }];
  card.cornerRadius = 12;
  card.resize(280, card.height);

  const titleNode = createTextNode(
    component.title ?? "",
    "subheading",
    "textPrimary",
    tokens,
    cardBgHex
  );
  card.appendChild(titleNode);

  const priceNode = createTextNode(
    component.price ?? "",
    "heading",
    "primary",
    tokens,
    cardBgHex
  );
  card.appendChild(priceNode);

  for (const feature of component.features ?? []) {
    const featureNode = createTextNode(
      `- ${feature}`,
      "body",
      "textSecondary",
      tokens,
      cardBgHex
    );
    card.appendChild(featureNode);
  }

  const button = createButtonNode(component.ctaLabel ?? "Get started", tokens);
  card.appendChild(button);

  return card;
}

// Creates a testimonial card: a vertically stacked frame with a quote,
// author name, and author role/company — same fill/corner/padding as card.
function createTestimonialCardNode(
  component: ComponentNode,
  tokens: DesignTokens
): FrameNode {
  const card = figma.createFrame();
  card.name = `TestimonialCard: ${component.author ?? ""}`;
  applyAutoLayout(card, "vertical", "start", 24, 12);
  const cardBgHex = tokens.colors["surface"] ?? "#FFFFFF";
  card.fills = [{ type: "SOLID", color: hexToRgb(cardBgHex) }];
  card.cornerRadius = 12;
  card.resize(280, card.height);

  const quoteNode = createTextNode(
    component.quote ?? "",
    "body",
    "textPrimary",
    tokens,
    cardBgHex
  );
  quoteNode.resize(232, quoteNode.height);
  quoteNode.textAutoResize = "HEIGHT";
  card.appendChild(quoteNode);

  const authorNode = createTextNode(
    component.author ?? "",
    "subheading",
    "textPrimary",
    tokens,
    cardBgHex
  );
  card.appendChild(authorNode);

  const roleNode = createTextNode(
    component.authorRole ?? "",
    "body",
    "textSecondary",
    tokens,
    cardBgHex
  );
  card.appendChild(roleNode);

  return card;
}

// Dispatches on `type` — the discriminated union pattern from Module 2 —
// to decide which creation function to call for a given schema component.
// sectionBgHex is the effective background of the containing section (the page
// background, since sections have no fill of their own) — used for contrast
// checking on section-level heading and text nodes.
export function buildComponent(
  component: ComponentNode,
  tokens: DesignTokens,
  sectionBgHex: string
): SceneNode {
  switch (component.type) {
    case "heading":
      return createTextNode(
        component.text ?? "",
        component.style ?? "heading",
        component.color ?? "textPrimary",
        tokens,
        sectionBgHex
      );
    case "text":
      return createTextNode(
        component.text ?? "",
        component.style ?? "body",
        component.color ?? "textSecondary",
        tokens,
        sectionBgHex
      );
    case "button":
      return createButtonNode(component.text ?? "Button", tokens);
    case "card":
      return createCardNode(
        component.title ?? "",
        component.description ?? "",
        tokens
      );
    case "pricingCard":
      return createPricingCardNode(component, tokens);
    case "testimonialCard":
      return createTestimonialCardNode(component, tokens);
    default:
      // Defensive fallback: if the schema ever contains an unknown type,
      // we create a visible placeholder rather than silently crashing.
      const fallback = figma.createText();
      fallback.characters = `Unsupported type: ${component.type}`;
      return fallback;
  }
}
