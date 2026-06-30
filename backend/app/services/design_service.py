import json
from json import JSONDecodeError

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

Hard rules — violating any causes rejection:
- sections: 3 to 6 items; every section must have "type": "section"
- variant: exactly one of "hero" "features" "footer" "pricing" "testimonials"
- component type: exactly one of "heading" "text" "button" "card" "pricingCard" "testimonialCard"
- card requires title + description
- pricingCard requires title, price (string like "$29/mo"), features (array of strings), ctaLabel
- testimonialCard requires quote, author, authorRole
- layout.direction: "horizontal" or "vertical"; layout.align: "start" "center" or "end"
- padding and gap values must be keys that exist in designTokens.spacing
- page.frame.background must be a key that exists in designTokens.colors
- color token values must be hex strings (#RRGGBB); spacing values must be integers
- ALL content must be specific and relevant to the user's prompt — no generic filler
"""


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
    """JSON-parse then Pydantic-validate. Raises JSONDecodeError or ValidationError on failure."""
    data = json.loads(raw)
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
    messages: list[dict] = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    # ── First attempt ────────────────────────────────────────────────────────
    raw = _call_with_json_format_fallback(messages)
    if raw is None:
        logger.warning("FALLBACK: using sample_design — API call failed on first attempt")
        return SAMPLE_DESIGN

    # Save error outside the except block — Python 3 deletes the `as e` binding
    # when the except block exits, so we capture it explicitly for use in retry.
    first_error: Exception | None = None
    try:
        return _parse_and_validate(raw)
    except (JSONDecodeError, ValidationError) as exc:
        logger.error("First attempt failed parse/validation: %s", exc)
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

    try:
        return _parse_and_validate(raw2)
    except (JSONDecodeError, ValidationError) as exc:
        logger.warning("FALLBACK: using sample_design — retry also failed validation: %s", exc)
        return SAMPLE_DESIGN
