from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "text-to-figma-backend"
    DEBUG: bool = False
    PORT: int = 8000

    # OpenRouter — key is required (no default); server won't start without it.
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "qwen/qwen3-14b:free"


settings = Settings()
