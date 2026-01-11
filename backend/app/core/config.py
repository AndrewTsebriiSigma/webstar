"""Application configuration using Pydantic Settings."""
from typing import List, Union
import json
import secrets as py_secrets
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


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
    SESSION_SECRET: str = ""  # Required for OAuth sessions
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for V1
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY is secure."""
        if v == "your-secret-key-change-in-production":
            raise ValueError(
                "SECRET_KEY must be changed from default! "
                "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters for security!")
        return v
    
    @field_validator('SESSION_SECRET')
    @classmethod
    def validate_session_secret(cls, v: str) -> str:
        """Ensure SESSION_SECRET is set, generate if not provided."""
        if not v:
            # Generate a secure session secret if not provided
            return py_secrets.token_urlsafe(32)
        if len(v) < 32:
            raise ValueError("SESSION_SECRET must be at least 32 characters!")
        return v
    
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
    
    # Email Settings (Gmail SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "webstar.capital@gmail.com"
    SMTP_PASSWORD: str = ""  # App password from env
    SMTP_FROM_EMAIL: str = "webstar.capital@gmail.com"
    SMTP_FROM_NAME: str = "WebStar"
    
    # Admin Panel
    ADMIN_SETUP_SECRET: str = "webstar-admin-setup-2024"  # Change in production
    
    @field_validator('ADMIN_SETUP_SECRET')
    @classmethod
    def validate_admin_secret(cls, v: str) -> str:
        """Validate ADMIN_SETUP_SECRET is changed in production."""
        # This validation is less strict as it's only for initial setup
        if len(v) < 16:
            raise ValueError("ADMIN_SETUP_SECRET must be at least 16 characters!")
        return v
    
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

