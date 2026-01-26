"""FastAPI application factory and main entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pathlib import Path
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
import secrets
import time

from app.core.config import settings
from app.db.base import create_db_and_tables
from app.routers import auth, onboarding, profile, portfolio, projects, economy, analytics, uploads, app_settings, diagnostics, admin, quiz
from app.core.exception_handlers import (
    sqlalchemy_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    create_db_and_tables()
    yield
    # Shutdown
    pass


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # CSP header - adjust based on your needs
        csp_directives = [
            "default-src 'self'",
            "img-src 'self' data: https:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Adjust for production
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self' data:",
            "connect-src 'self' https:",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
        
        return response


app = FastAPI(
    title="WebStar V1 API",
    description="Backend API for WebStar V1 - One Professional Identity in One Link",
    version="1.0.0",
    lifespan=lifespan,
)

# Add Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add SessionMiddleware for OAuth (required by authlib)
SESSION_SECRET = settings.SESSION_SECRET
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="webstar_session",
    max_age=3600,  # 1 hour
    same_site="lax",
    https_only=settings.ENVIRONMENT.lower() == "production",
)

# CORS Configuration
import logging
logger = logging.getLogger(__name__)

# Helper function to normalize origin URLs
def normalize_origin(origin: str) -> str:
    """Normalize origin URL - add https:// if missing protocol."""
    if not origin:
        return origin
    origin = origin.strip()
    # If it doesn't start with http:// or https://, add https://
    if not origin.startswith(('http://', 'https://')):
        origin = f'https://{origin}'
    return origin

# Get and normalize CORS origins
cors_origins_list = settings.cors_origins_list.copy()

# Normalize all origins (add protocol if missing)
cors_origins_list = [normalize_origin(origin) if isinstance(origin, str) else origin for origin in cors_origins_list]

# For production, ensure frontend URL is included
if settings.ENVIRONMENT.lower() == "production":
    # Check raw CORS_ORIGINS value (before parsing) to see if we got a single hostname from Render
    raw_cors = settings.CORS_ORIGINS
    if isinstance(raw_cors, str):
        # This might be a single hostname from Render (e.g., "webstar-frontend.onrender.com")
        normalized = normalize_origin(raw_cors)
        if normalized not in cors_origins_list:
            cors_origins_list.append(normalized)
    
    # Ensure the production frontend URLs are always included
    # webstar.bio must be first for OAuth redirects (uses CORS_ORIGINS[0])
    production_domains = [
        "https://webstar.bio",
        "https://www.webstar.bio",
        "https://webstar-frontend.onrender.com"  # Keep for backwards compatibility
    ]
    for domain in production_domains:
        if domain not in cors_origins_list:
            cors_origins_list.append(domain)
    
    # Log CORS origins for debugging
    logger.info(f"CORS origins configured: {cors_origins_list}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
else:
    # For development, ensure localhost is included
    if "http://localhost:3000" not in cors_origins_list:
        cors_origins_list.append("http://localhost:3000")
    if "http://127.0.0.1:3000" not in cors_origins_list:
        cors_origins_list.append("http://127.0.0.1:3000")
    # SECURITY FIX: Never use wildcard "*" even in development
    # This allows proper CORS testing and prevents security issues
    logger.info(f"Development CORS origins: {cors_origins_list}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,  # Always allow credentials for JWT tokens
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Log startup info
logger.info(f"Starting WebStar API in {settings.ENVIRONMENT} mode")
logger.info(f"CORS enabled for origins: {cors_origins_list}")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(profile.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(economy.router, prefix="/api/economy", tags=["economy"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(app_settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(diagnostics.router, prefix="/api/diagnostics", tags=["diagnostics"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "webstar-v1-api"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "WebStar V1 API",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "One Professional Identity in One Link"
    }


# Mount static files for uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# Register exception handlers
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
# Temporarily disabled to avoid hiding errors during debugging
# app.add_exception_handler(Exception, generic_exception_handler)

