"""FastAPI application factory and main entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.db.base import create_db_and_tables
from app.routers import auth, onboarding, profile, portfolio, projects, economy, analytics, uploads


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    create_db_and_tables()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="WebStar V1 API",
    description="Backend API for WebStar V1 - One Professional Identity in One Link",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
cors_origins_list = settings.cors_origins_list.copy()

# For production, ensure frontend URL is included
if settings.ENVIRONMENT.lower() == "production":
    # If CORS_ORIGINS is a single URL string (from Render), ensure it's in the list
    if isinstance(settings.CORS_ORIGINS, str) and settings.CORS_ORIGINS not in cors_origins_list:
        cors_origins_list.append(settings.CORS_ORIGINS)
else:
    # For development, ensure localhost is included
    if "http://localhost:3000" not in cors_origins_list:
        cors_origins_list.append("http://localhost:3000")
    if "http://127.0.0.1:3000" not in cors_origins_list:
        cors_origins_list.append("http://127.0.0.1:3000")
    # For development, allow all origins
    if settings.ENVIRONMENT.lower() == "development":
        cors_origins_list = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=False if cors_origins_list == ["*"] else True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["onboarding"])
app.include_router(profile.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(economy.router, prefix="/api/economy", tags=["economy"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])


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

