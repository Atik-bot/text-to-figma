import { ComponentNode, DesignTokens } from "./types";
import { hexToRgb, applyAutoLayout } from "./helpers";

// Figma requires fonts to be explicitly "loaded" before you can create or
// edit text with them. This is a one-time async step we'll call before
// any text node creation happens.
export async function loadFonts(): Promise<void> {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
}

// Creates a single text node and applies a named typography style + color
// from our design tokens.
function createTextNode(
  content: string,
  styleName: string,
  colorName: string,
  tokens: DesignTokens
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

  node.fontName = { family: typeStyle.fontFamily, style: weightToStyle };
  node.fontSize = typeStyle.fontSize;
  node.characters = content;

  const hex = tokens.colors[colorName] ?? tokens.colors.textPrimary;
  node.fills = [{ type: "SOLID", color: hexToRgb(hex) }];

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
  button.fills = [
    { type: "SOLID", color: hexToRgb(tokens.colors.primary) },
  ];

  const text = createTextNode(label, "body", "background", tokens);
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
  card.fills = [{ type: "SOLID", color: hexToRgb(tokens.colors.surface) }];
  card.cornerRadius = 12;
  card.resize(280, card.height);

  const titleNode = createTextNode(title, "subheading", "textPrimary", tokens);
  const descNode = createTextNode(description, "body", "textSecondary", tokens);
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
  card.fills = [{ type: "SOLID", color: hexToRgb(tokens.colors.surface) }];
  card.cornerRadius = 12;
  card.resize(280, card.height);

  const titleNode = createTextNode(
    component.title ?? "",
    "subheading",
    "textPrimary",
    tokens
  );
  card.appendChild(titleNode);

  const priceNode = createTextNode(
    component.price ?? "",
    "heading",
    "primary",
    tokens
  );
  card.appendChild(priceNode);

  for (const feature of component.features ?? []) {
    const featureNode = createTextNode(
      `- ${feature}`,
      "body",
      "textSecondary",
      tokens
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
  card.fills = [{ type: "SOLID", color: hexToRgb(tokens.colors.surface) }];
  card.cornerRadius = 12;
  card.resize(280, card.height);

  const quoteNode = createTextNode(
    component.quote ?? "",
    "body",
    "textPrimary",
    tokens
  );
  quoteNode.resize(232, quoteNode.height);
  quoteNode.textAutoResize = "HEIGHT";
  card.appendChild(quoteNode);

  const authorNode = createTextNode(
    component.author ?? "",
    "subheading",
    "textPrimary",
    tokens
  );
  card.appendChild(authorNode);

  const roleNode = createTextNode(
    component.authorRole ?? "",
    "body",
    "textSecondary",
    tokens
  );
  card.appendChild(roleNode);

  return card;
}

// Dispatches on `type` — the discriminated union pattern from Module 2 —
// to decide which creation function to call for a given schema component.
export function buildComponent(
  component: ComponentNode,
  tokens: DesignTokens
): SceneNode {
  switch (component.type) {
    case "heading":
      return createTextNode(
        component.text ?? "",
        component.style ?? "heading",
        component.color ?? "textPrimary",
        tokens
      );
    case "text":
      return createTextNode(
        component.text ?? "",
        component.style ?? "body",
        component.color ?? "textSecondary",
        tokens
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
