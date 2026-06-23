"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- App ---
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://competitour:changeme@postgres:5432/competitour"

    # --- Redis ---
    REDIS_URL: str = "redis://redis:6379/0"

    # --- Torch Labs Proxy ---
    TORCH_GATEWAY_HOST: str = "geox.torchproxies.com"
    TORCH_GATEWAY_PORT: int = 6011
    TORCH_USERNAME: str = ""
    TORCH_PASSWORD: str = ""

    # --- Google (Gemini) ---
    GEMINI_API_KEY: str = ""

    # --- JWT Auth ---
    JWT_SECRET_KEY: str = "changeme_jwt_secret_at_least_32_chars"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance — reads .env once."""
    return Settings()
