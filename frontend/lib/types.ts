// Mirrors figma-plugin/src/types.ts so the frontend and plugin stay in sync.

export interface TypographyStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyStyle>;
  spacing: Record<string, number>;
}

export interface ComponentNode {
  type: "heading" | "text" | "button" | "card" | "pricingCard" | "testimonialCard";
  text?: string;
  description?: string;
  title?: string;
  icon?: string;
  style?: string;
  color?: string;
  variant?: string;
  // pricingCard fields
  price?: string;
  features?: string[];
  ctaLabel?: string;
  // testimonialCard fields
  quote?: string;
  author?: string;
  authorRole?: string;
}

export interface SectionLayout {
  direction: "horizontal" | "vertical";
  align: "start" | "center" | "end";
  padding: string;
  gap: string;
}

export interface SectionNode {
  type: "section";
  variant: "hero" | "features" | "footer" | "pricing" | "testimonials";
  id: string;
  layout: SectionLayout;
  children: ComponentNode[];
}

export interface PageFrame {
  width: number;
  background: string;
  sections: SectionNode[];
}

export interface Page {
  name: string;
  frame: PageFrame;
}

export interface DesignSchema {
  designTokens: DesignTokens;
  page: Page;
}
