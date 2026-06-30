from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import router

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.include_router(router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
