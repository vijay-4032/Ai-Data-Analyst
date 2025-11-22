"""
Application Configuration
Loads settings from environment variables
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )
    
    # ----- Application -----
    APP_NAME: str = "AI Analyst"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # ----- Server -----
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # ----- Security -----
    SECRET_KEY: str = Field(default="change-me-in-production-use-openssl-rand-base64-32")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # ----- CORS -----
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # ----- Database -----
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/ai_analyst"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # ----- Redis -----
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600  # 1 hour
    
    # ----- AI Services -----
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_MAX_TOKENS: int = 4096
    
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-sonnet-20240229"
    ANTHROPIC_MAX_TOKENS: int = 4096
    
    # Default AI provider: "openai" or "anthropic"
    AI_PROVIDER: str = "openai"
    
    # ----- File Upload -----
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = [".csv", ".xlsx", ".xls"]
    UPLOAD_DIR: str = "uploads"
    
    @field_validator("ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v
    
    # ----- AWS S3 (Optional) -----
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: Optional[str] = None
    USE_S3: bool = False
    
    # ----- Rate Limiting -----
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # ----- Analysis Settings -----
    MAX_ROWS_PREVIEW: int = 1000
    MAX_COLUMNS: int = 100
    SAMPLE_SIZE: int = 5
    
    # ----- Feature Flags -----
    ENABLE_CHAT: bool = True
    ENABLE_EXPORT: bool = True
    ENABLE_SHARING: bool = False
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def database_url_sync(self) -> str:
        """Synchronous database URL for migrations"""
        return self.DATABASE_URL.replace("+asyncpg", "")


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Use dependency injection in FastAPI routes
    """
    return Settings()


# Global settings instance
settings = get_settings()


# ===========================================
# Environment-specific configurations
# ===========================================

class DevelopmentSettings(Settings):
    """Development environment settings"""
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"


class ProductionSettings(Settings):
    """Production environment settings"""
    DEBUG: bool = False
    LOG_LEVEL: str = "WARNING"
    
    # Force HTTPS in production
    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def validate_https(cls, v):
        for origin in v:
            if origin.startswith("http://") and "localhost" not in origin:
                raise ValueError("Production CORS origins must use HTTPS")
        return v


def get_settings_by_environment() -> Settings:
    """Get settings based on environment"""
    env = Settings().ENVIRONMENT
    if env == "production":
        return ProductionSettings()
    return DevelopmentSettings()