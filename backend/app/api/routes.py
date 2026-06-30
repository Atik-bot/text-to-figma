from fastapi import APIRouter
from app.schemas.design_schema import DesignSchema, PromptRequest
from app.services.design_service import generate_design
from app.core.logging import logger

router = APIRouter()


@router.post("/generate", response_model=DesignSchema, response_model_exclude_none=True)
async def generate(request: PromptRequest) -> DesignSchema:
    logger.info("POST /generate — prompt=%r", request.prompt)
    return generate_design(request.prompt)
