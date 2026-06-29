// These types mirror the JSON schema from Module 2.
// Keeping them in sync with the schema is what lets TypeScript catch
// mistakes (typos, missing fields) before the code ever runs in Figma.

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<
    string,
    { fontFamily: string; fontWeight: number; fontSize: number }
  >;
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

export interface DesignSchema {
  designTokens: DesignTokens;
  page: {
    name: string;
    frame: {
      width: number;
      background: string;
      sections: SectionNode[];
    };
  };
}
