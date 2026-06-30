from app.schemas.design_schema import (
    DesignSchema,
    DesignTokens,
    TypographyStyle,
    ComponentNode,
    SectionLayout,
    SectionNode,
    PageFrame,
    Page,
)

SAMPLE_DESIGN = DesignSchema(
    designTokens=DesignTokens(
        colors={
            "primary": "#2563EB",
            "secondary": "#1E40AF",
            "background": "#FFFFFF",
            "surface": "#F8FAFC",
            "textPrimary": "#0F172A",
            "textSecondary": "#475569",
        },
        typography={
            "heading": TypographyStyle(fontFamily="Inter", fontWeight=700, fontSize=48),
            "subheading": TypographyStyle(fontFamily="Inter", fontWeight=600, fontSize=24),
            "body": TypographyStyle(fontFamily="Inter", fontWeight=400, fontSize=16),
        },
        spacing={
            "sectionPaddingY": 96,
            "sectionPaddingX": 80,
            "gapSmall": 16,
            "gapMedium": 32,
            "gapLarge": 64,
        },
    ),
    page=Page(
        name="Landing Page",
        frame=PageFrame(
            width=1440,
            background="background",
            sections=[
                SectionNode(
                    type="section",
                    variant="hero",
                    id="hero-1",
                    layout=SectionLayout(
                        direction="vertical",
                        align="center",
                        padding="sectionPaddingY",
                        gap="gapMedium",
                    ),
                    children=[
                        ComponentNode(type="heading", text="Ship your SaaS faster", style="heading", color="textPrimary"),
                        ComponentNode(type="text", text="The all-in-one platform for modern teams.", style="body", color="textSecondary"),
                        ComponentNode(type="button", text="Get started"),
                    ],
                ),
                SectionNode(
                    type="section",
                    variant="features",
                    id="features-1",
                    layout=SectionLayout(
                        direction="horizontal",
                        align="start",
                        padding="sectionPaddingY",
                        gap="gapLarge",
                    ),
                    children=[
                        ComponentNode(type="card", title="Fast", description="Built for speed from day one."),
                        ComponentNode(type="card", title="Secure", description="Enterprise-grade security built in."),
                        ComponentNode(type="card", title="Scalable", description="Grows with your business."),
                    ],
                ),
                SectionNode(
                    type="section",
                    variant="pricing",
                    id="pricing-1",
                    layout=SectionLayout(
                        direction="horizontal",
                        align="center",
                        padding="sectionPaddingY",
                        gap="gapLarge",
                    ),
                    children=[
                        ComponentNode(
                            type="pricingCard",
                            title="Starter",
                            price="$0/mo",
                            features=["5 designs per month", "JSON schema editor", "Community support"],
                            ctaLabel="Start free",
                        ),
                        ComponentNode(
                            type="pricingCard",
                            title="Pro",
                            price="$29/mo",
                            features=["Unlimited designs", "All section variants", "Priority support"],
                            ctaLabel="Upgrade to Pro",
                        ),
                    ],
                ),
                SectionNode(
                    type="section",
                    variant="testimonials",
                    id="testimonials-1",
                    layout=SectionLayout(
                        direction="horizontal",
                        align="start",
                        padding="sectionPaddingY",
                        gap="gapMedium",
                    ),
                    children=[
                        ComponentNode(
                            type="testimonialCard",
                            quote="We cut our design handoff time in half.",
                            author="Sara Kim",
                            authorRole="Lead Designer, Vercel",
                        ),
                    ],
                ),
                SectionNode(
                    type="section",
                    variant="footer",
                    id="footer-1",
                    layout=SectionLayout(
                        direction="horizontal",
                        align="center",
                        padding="sectionPaddingY",
                        gap="gapSmall",
                    ),
                    children=[
                        ComponentNode(
                            type="text",
                            text="© 2026 YourCompany. All rights reserved.",
                            style="body",
                            color="textSecondary",
                        ),
                    ],
                ),
            ],
        ),
    ),
)
