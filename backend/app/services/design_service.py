import json
import re
from json import JSONDecodeError
from typing import Any

import openai
from pydantic import ValidationError

from app.core.config import settings
from app.core.logging import logger
from app.data.sample_design import SAMPLE_DESIGN
from app.schemas.design_schema import DesignSchema

# Build the client once at import time — one instance, reused per request.
_client = openai.OpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

# Build a concrete structural example from the Pydantic schema so the prompt
# stays in sync with the models automatically — but formatted as a filled-in
# template rather than an abstract meta-schema, which LLMs follow far more reliably.
_SCHEMA_FIELDS = DesignSchema.model_json_schema()  # kept so schema is still referenced

_SYSTEM_PROMPT = """\
You are a design system generator.
YOUR ENTIRE RESPONSE MUST BE A SINGLE RAW JSON OBJECT — no markdown fences, no explanation, \
no text before or after. Start with { and end with }.

Follow this exact structure (replace all placeholder values with real content):

{
  "designTokens": {
    "colors": {
      "primary": "#HEX",
      "background": "#HEX",
      "surface": "#HEX",
      "textPrimary": "#HEX",
      "textSecondary": "#HEX"
    },
    "typography": {
      "heading":    {"fontFamily": "Inter", "fontWeight": 700, "fontSize": 48},
      "subheading": {"fontFamily": "Inter", "fontWeight": 600, "fontSize": 24},
      "body":       {"fontFamily": "Inter", "fontWeight": 400, "fontSize": 16}
    },
    "spacing": {"sectionPad": 80, "gap": 32, "gapSm": 16}
  },
  "page": {
    "name": "Page Title",
    "frame": {
      "width": 1440,
      "background": "background",
      "sections": [
        {
          "type": "section", "variant": "hero", "id": "hero-1",
          "layout": {"direction": "vertical", "align": "center", "padding": "sectionPad", "gap": "gap"},
          "children": [
            {"type": "heading", "text": "Main headline", "style": "heading", "color": "textPrimary"},
            {"type": "text",    "text": "Subtext here",  "style": "body",    "color": "textSecondary"},
            {"type": "button",  "text": "CTA label"}
          ]
        },
        {
          "type": "section", "variant": "features", "id": "features-1",
          "layout": {"direction": "horizontal", "align": "start", "padding": "sectionPad", "gap": "gap"},
          "children": [
            {"type": "card", "title": "Feature 1", "description": "Description 1"},
            {"type": "card", "title": "Feature 2", "description": "Description 2"},
            {"type": "card", "title": "Feature 3", "description": "Description 3"}
          ]
        },
        {
          "type": "section", "variant": "footer", "id": "footer-1",
          "layout": {"direction": "horizontal", "align": "center", "padding": "sectionPad", "gap": "gapSm"},
          "children": [
            {"type": "text", "text": "Footer text", "style": "body", "color": "textSecondary"}
          ]
        }
      ]
    }
  }
}

Hard rules — violating any causes IMMEDIATE REJECTION. Read these carefully:

SECTION VARIANT — the ONLY valid values are these 5 exact strings:
  "hero"  "features"  "pricing"  "testimonials"  "footer"
Do NOT use: "contact", "about", "services", "cta", "gallery", "team", "faq", "portfolio", \
"blog", or ANY other string. If you want a contact section, use "footer". \
If you want an about section, use "features". There are exactly 5 valid variants — no others exist.

COMPONENT TYPE — the ONLY valid values are these 6 exact strings:
  "heading"  "text"  "button"  "card"  "pricingCard"  "testimonialCard"
Do NOT use: "price", "feature", "label", "subtitle", "paragraph", "link", "image", "icon", \
or ANY other string. There are exactly 6 valid component types — no others exist.

OTHER RULES:
- sections: 3 to 6 items; every section must have "type": "section"
- card requires title + description
- pricingCard requires title, price (string like "$29/mo"), features (array of strings), ctaLabel
- testimonialCard requires quote, author, authorRole
- layout.direction: "horizontal" or "vertical"; layout.align: "start" "center" or "end"
- padding and gap values must be keys that exist in designTokens.spacing
- page.frame.background must be a key that exists in designTokens.colors
- color token values must be hex strings (#RRGGBB); spacing values must be integers
- ALL content must be specific and relevant to the user's prompt — no generic filler
"""

# ── Normalizer constants ──────────────────────────────────────────────────────

_VALID_VARIANTS = frozenset({"hero", "features", "pricing", "testimonials", "footer"})
_VALID_COMPONENT_TYPES = frozenset({"heading", "text", "button", "card", "pricingCard", "testimonialCard"})
_VALID_DIRECTIONS = frozenset({"horizontal", "vertical"})
_VALID_ALIGNS = frozenset({"start", "center", "end"})

_VARIANT_MAP: dict[str, str] = {
    "contact": "footer",
    "cta": "hero",
    "about": "features",
    "services": "features",
    "gallery": "features",
    "team": "features",
    "faq": "footer",
    "portfolio": "features",
    "blog": "features",
    "work": "features",
}
_COMPONENT_TYPE_MAP: dict[str, str] = {
    "price": "text",
    "feature": "text",
    "label": "text",
    "subtitle": "text",
    "paragraph": "text",
    "description": "text",
    "link": "button",
    "cta": "button",
    "image": "text",
    "icon": "text",
}
_DIRECTION_MAP: dict[str, str] = {
    "row": "horizontal",
    "column": "vertical",
    "col": "vertical",
    "vert": "vertical",
    "horiz": "horizontal",
    "h": "horizontal",
    "v": "vertical",
}
_ALIGN_MAP: dict[str, str] = {
    "left": "start",
    "right": "end",
    "middle": "center",
    "flex-start": "start",
    "flex-end": "end",
    "top": "start",
    "bottom": "end",
}
_TYPOGRAPHY_STYLE_MAP: dict[str, str] = {
    "h1": "heading",
    "h2": "heading",
    "h3": "heading",
    "h4": "subheading",
    "h5": "subheading",
    "h6": "subheading",
    "title": "heading",
    "display": "heading",
    "hero": "heading",
    "subtitle": "subheading",
    "caption": "body",
    "small": "body",
    "normal": "body",
    "p": "body",
    "button": "body",
    "label": "body",
    "cta": "body",
    "default": "body",
}

_HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


# ── Normalizer helpers ────────────────────────────────────────────────────────

def _normalize_closed_vocab(
    value: Any,
    valid_set: frozenset[str],
    near_miss_map: dict[str, str],
    default: str,
    field_path: str,
) -> str:
    """Return value unchanged if valid; otherwise apply near-miss map or default."""
    if isinstance(value, str) and value in valid_set:
        return value
    corrected = near_miss_map.get(value, default) if isinstance(value, str) else default
    logger.warning("Normalized %s: %r -> %r", field_path, value, corrected)
    return corrected


def _normalize_color_ref(value: Any, colors: dict, field_path: str) -> Any:
    """
    Ensure value is a key in colors.
    - Valid key: return unchanged.
    - Raw hex (#RRGGBB): try to match an existing token by value, or promote to a new token.
    - Anything else: fall back to the first available color key.
    """
    if not isinstance(value, str):
        return value
    if value in colors:
        return value
    if _HEX_RE.match(value):
        hex_lower = value.lower()
        for key, existing in colors.items():
            if isinstance(existing, str) and existing.lower() == hex_lower:
                logger.warning("Normalized %s: %r -> %r (matched existing color token)", field_path, value, key)
                return key
        new_key = "color" + value.lstrip("#").upper()
        colors[new_key] = value.upper()
        logger.warning("Normalized %s: %r -> %r (promoted raw hex to new token)", field_path, value, new_key)
        return new_key
    fallback = next(iter(colors), "background")
    logger.warning("Normalized %s: %r -> %r (unknown color reference)", field_path, value, fallback)
    return fallback


def _normalize_typography_ref(value: Any, typography: dict, field_path: str) -> Any:
    """
    Ensure value is a key in typography.
    Applies a near-miss map (h1/h2 → heading, etc.); falls back to 'body'.
    Returns None-like inputs unchanged so optional fields stay absent.
    """
    if not isinstance(value, str):
        return value
    if value in typography:
        return value
    candidate = _TYPOGRAPHY_STYLE_MAP.get(value)
    if candidate and candidate in typography:
        logger.warning("Normalized %s: %r -> %r", field_path, value, candidate)
        return candidate
    fallback = "body" if "body" in typography else next(iter(typography), value)
    logger.warning("Normalized %s: %r -> %r (fallback)", field_path, value, fallback)
    return fallback


def _normalize_spacing_ref(value: Any, spacing: dict, field_path: str) -> Any:
    """
    Ensure value is a key in spacing.
    - Valid key: return unchanged.
    - Number (int/float) or numeric string: find the spacing key whose value is closest.
    - Unknown string or None: fall back to the first spacing key.
    """
    if not spacing:
        return value
    if isinstance(value, str) and value in spacing:
        return value

    # Try to treat value as a numeric amount and find the closest spacing entry.
    numeric: float | None = None
    if isinstance(value, (int, float)):
        numeric = float(value)
    elif isinstance(value, str):
        try:
            numeric = float(value)
        except ValueError:
            pass

    if numeric is not None:
        closest = min(
            spacing,
            key=lambda k: abs((spacing[k] if isinstance(spacing[k], (int, float)) else 0) - numeric),
        )
        logger.warning("Normalized %s: %r -> %r (nearest spacing value)", field_path, value, closest)
        return closest

    fallback = next(iter(spacing))
    logger.warning("Normalized %s: %r -> %r (unknown spacing reference)", field_path, value, fallback)
    return fallback


# ── Main normalizer ───────────────────────────────────────────────────────────

def normalize_design_json(data: dict) -> dict:
    """
    Walk the full parsed design JSON once and correct every field that has a
    known fixed domain, before the dict reaches Pydantic validation.

    Closed-vocabulary fields:
        section.variant, component.type, layout.direction, layout.align

    Reference fields (must be a key in a designTokens sub-object):
        page.frame.background, component.color  → colors  (hex-promote strategy)
        component.style                          → typography  (near-miss map)
        layout.padding, layout.gap               → spacing  (closest-value strategy)

    One WARNING is logged per correction in a consistent format:
        "Normalized {field_path}: {original!r} -> {corrected!r}"
    """
    try:
        tokens = data["designTokens"]
        colors: dict = tokens["colors"]
        typography: dict = tokens["typography"]
        spacing: dict = tokens["spacing"]
    except (KeyError, TypeError):
        return data

    # ── page.frame.background ────────────────────────────────────────────────
    try:
        frame = data["page"]["frame"]
        bg = frame.get("background")
        if bg is not None:
            frame["background"] = _normalize_color_ref(bg, colors, "page.frame.background")
    except (KeyError, TypeError):
        pass

    # ── sections ─────────────────────────────────────────────────────────────
    try:
        sections = data["page"]["frame"]["sections"]
    except (KeyError, TypeError):
        return data

    for i, section in enumerate(sections):
        if not isinstance(section, dict):
            continue
        sp = f"sections[{i}]"

        section["variant"] = _normalize_closed_vocab(
            section.get("variant"), _VALID_VARIANTS, _VARIANT_MAP, "features", f"{sp}.variant"
        )

        layout = section.get("layout")
        if isinstance(layout, dict):
            layout["direction"] = _normalize_closed_vocab(
                layout.get("direction"), _VALID_DIRECTIONS, _DIRECTION_MAP, "vertical", f"{sp}.layout.direction"
            )
            layout["align"] = _normalize_closed_vocab(
                layout.get("align"), _VALID_ALIGNS, _ALIGN_MAP, "start", f"{sp}.layout.align"
            )
            layout["padding"] = _normalize_spacing_ref(
                layout.get("padding"), spacing, f"{sp}.layout.padding"
            )
            layout["gap"] = _normalize_spacing_ref(
                layout.get("gap"), spacing, f"{sp}.layout.gap"
            )

        for j, child in enumerate(section.get("children", [])):
            if not isinstance(child, dict):
                continue
            cp = f"{sp}.children[{j}]"

            child["type"] = _normalize_closed_vocab(
                child.get("type"), _VALID_COMPONENT_TYPES, _COMPONENT_TYPE_MAP, "text", f"{cp}.type"
            )

            color = child.get("color")
            if color is not None:
                child["color"] = _normalize_color_ref(color, colors, f"{cp}.color")

            style = child.get("style")
            if style is not None:
                child["style"] = _normalize_typography_ref(style, typography, f"{cp}.style")

    return data


# ── API plumbing (unchanged) ──────────────────────────────────────────────────

def _call_model(messages: list[dict], use_json_format: bool = True) -> str:
    """Send messages to the model and return the raw response string."""
    kwargs: dict = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        # Free-tier models often default to 1024 tokens, which truncates a full
        # DesignSchema response. 4096 gives enough room for the largest valid output.
        "max_tokens": 4096,
    }
    if use_json_format:
        kwargs["response_format"] = {"type": "json_object"}
    response = _client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


def _parse_and_validate(raw: str) -> DesignSchema:
    """JSON-parse, normalize, then Pydantic-validate."""
    data = json.loads(raw)
    data = normalize_design_json(data)
    return DesignSchema.model_validate(data)


def _call_with_json_format_fallback(messages: list[dict]) -> str | None:
    """
    Try the call with response_format=json_object. If the model rejects that
    parameter (HTTP 400 BadRequestError), retry once without it. Returns the
    raw content string, or None if any network/API error occurs.
    """
    try:
        return _call_model(messages, use_json_format=True)
    except openai.BadRequestError as exc:
        logger.warning("Model rejected response_format=json_object (%s) — retrying without it", exc)
        try:
            return _call_model(messages, use_json_format=False)
        except Exception as exc2:
            logger.error("API error on json_format fallback call: %s", exc2)
            return None
    except openai.AuthenticationError as exc:
        logger.error("OpenRouter authentication failed — check OPENROUTER_API_KEY: %s", exc)
        return None
    except openai.RateLimitError as exc:
        logger.error("OpenRouter rate limit hit: %s", exc)
        return None
    except openai.APIConnectionError as exc:
        logger.error("Network error connecting to OpenRouter: %s", exc)
        return None
    except Exception as exc:
        logger.error("Unexpected error calling OpenRouter: %s", exc)
        return None


def generate_design(prompt: str) -> DesignSchema:
    """
    Generate a DesignSchema from a natural-language prompt via OpenRouter.
    Falls back to the hardcoded sample if the AI call or validation fails after
    one retry — the caller always receives a usable design, never a 500.
    """
    logger.info("DIAG model=%s", settings.OPENROUTER_MODEL)

    messages: list[dict] = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    # ── First attempt ────────────────────────────────────────────────────────
    raw = _call_with_json_format_fallback(messages)
    if raw is None:
        logger.warning("FALLBACK: using sample_design — API call failed on first attempt")
        return SAMPLE_DESIGN

    logger.info("DIAG raw_response_first_200_chars=%r", raw[:200])

    # Save error outside the except block — Python 3 deletes the `as e` binding
    # when the except block exits, so we capture it explicitly for use in retry.
    first_error: Exception | None = None
    try:
        return _parse_and_validate(raw)
    except (JSONDecodeError, ValidationError) as exc:
        logger.error("First attempt failed parse/validation: %s", exc)
        logger.error("DIAG full_raw_first_attempt=%r", raw)
        first_error = exc

    # ── One retry with the broken output and error message ───────────────────
    retry_messages = messages + [
        {"role": "assistant", "content": raw},
        {
            "role": "user",
            "content": (
                f"Your previous response failed validation with this error:\n{first_error}\n\n"
                "Fix the JSON so it exactly matches the schema. "
                "Output ONLY the corrected raw JSON — no markdown, no explanation."
            ),
        },
    ]

    raw2 = _call_with_json_format_fallback(retry_messages)
    if raw2 is None:
        logger.warning("FALLBACK: using sample_design — API call failed on retry")
        return SAMPLE_DESIGN

    logger.info("DIAG raw_response_retry_first_200_chars=%r", raw2[:200])

    try:
        return _parse_and_validate(raw2)
    except (JSONDecodeError, ValidationError) as exc:
        logger.error("DIAG full_raw_retry=%r", raw2)
        logger.warning("FALLBACK: using sample_design — retry also failed validation: %s", exc)
        return SAMPLE_DESIGN
