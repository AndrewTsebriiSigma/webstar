"""Application configuration using Pydantic Settings."""
from typing import List, Union
import json
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins(v: Union[str, List[str]]) -> List[str]:
    """Parse CORS origins from string or list."""
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, ValueError):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
    return v


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    APP_NAME: str = "WebStar API"
    DEBUG: bool = False
    BASE_URL: str = "http://localhost:8000"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./webstar.db"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for V1
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # Cloudflare R2 Storage (S3-compatible)
    # Get credentials from: https://dash.cloudflare.com -> R2 -> Manage R2 API Tokens
    R2_ACCOUNT_ID: str = ""  # Your Cloudflare Account ID
    R2_ACCESS_KEY_ID: str = ""  # R2 API Token Access Key
    R2_SECRET_ACCESS_KEY: str = ""  # R2 API Token Secret Key
    R2_BUCKET_NAME: str = "webstar-uploads"
    R2_PUBLIC_URL: str = ""  # e.g., "https://pub-xxx.r2.dev" or custom domain
    
    # Legacy S3 settings (deprecated, kept for backwards compatibility)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "auto"
    S3_BUCKET_NAME: str = "webstar-uploads"
    S3_PRESIGNED_URL_EXPIRATION: int = 3600
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Media Compression Settings (FFmpeg)
    # Enable/disable automatic media compression before R2 upload
    COMPRESSION_ENABLED: bool = True
    # Quality presets: "high", "standard", "low"
    # High = best quality, larger files; Low = smaller files, lower quality
    COMPRESSION_VIDEO_PRESET: str = "standard"
    COMPRESSION_IMAGE_PRESET: str = "standard"
    COMPRESSION_AUDIO_PRESET: str = "standard"
    # Image output format: "webp" (best compression) or "jpeg" (max compatibility)
    COMPRESSION_IMAGE_FORMAT: str = "webp"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        return parse_cors_origins(self.CORS_ORIGINS)


settings = Settings()

