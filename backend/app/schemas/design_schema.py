from __future__ import annotations

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict


# ── Request ──────────────────────────────────────────────────────────────────

class PromptRequest(BaseModel):
    prompt: str


# ── Design token models ───────────────────────────────────────────────────────

class TypographyStyle(BaseModel):
    # Field names mirror the TypeScript TypographyStyle in figma-plugin/src/types.ts
    model_config = ConfigDict(populate_by_name=True)

    fontFamily: str
    fontWeight: int
    fontSize: int


class DesignTokens(BaseModel):
    # colors and spacing are open-ended dicts so any token name is valid
    model_config = ConfigDict(populate_by_name=True)

    colors: Dict[str, str]
    typography: Dict[str, TypographyStyle]
    spacing: Dict[str, int]


# ── Component model ───────────────────────────────────────────────────────────

class ComponentNode(BaseModel):
    """
    Single flat model covering all six component types (heading, text, button,
    card, pricingCard, testimonialCard). Optional fields mirror the TypeScript
    ComponentNode interface — unused fields for a given type are simply absent
    from the JSON output because of exclude_none below.
    """
    model_config = ConfigDict(populate_by_name=True)

    type: Literal["heading", "text", "button", "card", "pricingCard", "testimonialCard"]
    # heading / text / button
    text: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    # card
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    variant: Optional[str] = None
    # pricingCard
    price: Optional[str] = None
    features: Optional[List[str]] = None
    ctaLabel: Optional[str] = None
    # testimonialCard
    quote: Optional[str] = None
    author: Optional[str] = None
    authorRole: Optional[str] = None


# ── Section models ────────────────────────────────────────────────────────────

class SectionLayout(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    direction: Literal["horizontal", "vertical"]
    align: Literal["start", "center", "end"]
    padding: str
    gap: str


class SectionNode(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: Literal["section"]
    variant: Literal["hero", "features", "footer", "pricing", "testimonials"]
    id: str
    layout: SectionLayout
    children: List[ComponentNode]


# ── Page models ───────────────────────────────────────────────────────────────

class PageFrame(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    width: int
    background: str
    sections: List[SectionNode]


class Page(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    frame: PageFrame


# ── Root model ────────────────────────────────────────────────────────────────

class DesignSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    designTokens: DesignTokens
    page: Page
