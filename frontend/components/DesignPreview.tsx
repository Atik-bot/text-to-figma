import { ComponentNode, DesignSchema, SectionNode } from "@/lib/types";

function componentSummary(c: ComponentNode): string {
  switch (c.type) {
    case "heading":
      return `"${c.text ?? ""}"`;
    case "text":
      return `"${c.text ?? ""}"`;
    case "button":
      return `"${c.text ?? ""}"`;
    case "card":
      return `${c.title ?? ""} — ${c.description ?? ""}`;
    case "pricingCard":
      return `${c.title ?? ""} · ${c.price ?? ""}`;
    case "testimonialCard":
      return `"${c.quote ?? ""}" — ${c.author ?? ""}, ${c.authorRole ?? ""}`;
    default:
      return JSON.stringify(c);
  }
}

const VARIANT_LABEL: Record<string, string> = {
  hero: "Hero",
  features: "Features",
  pricing: "Pricing",
  testimonials: "Testimonials",
  footer: "Footer",
};

const TYPE_LABEL: Record<string, string> = {
  heading: "Heading",
  text: "Text",
  button: "Button",
  card: "Card",
  pricingCard: "Pricing card",
  testimonialCard: "Testimonial",
};

function SectionBlock({ section }: { section: SectionNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          {VARIANT_LABEL[section.variant] ?? section.variant}
        </span>
        <span className="text-xs text-gray-400">{section.layout.direction}</span>
      </div>
      <ul className="space-y-1.5">
        {section.children.map((child, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
              {TYPE_LABEL[child.type] ?? child.type}
            </span>
            <span className="text-gray-700 leading-snug">
              {componentSummary(child)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  data: DesignSchema;
}

export default function DesignPreview({ data }: Props) {
  const { page, designTokens } = data;
  const bgColor = designTokens.colors[page.frame.background] ?? "#fff";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">{page.name}</h2>
        <span
          className="inline-block h-4 w-4 rounded-full border border-gray-200"
          style={{ backgroundColor: bgColor }}
          title={`Background: ${bgColor}`}
        />
        <span className="text-sm text-gray-400">{page.frame.width}px wide</span>
      </div>
      <div className="space-y-3">
        {page.frame.sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
