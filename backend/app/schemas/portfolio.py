"""Portfolio schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class PortfolioItemCreate(BaseModel):
    """Create portfolio item."""
    content_type: str = Field(..., description="photo, video, audio, text, or link")
    content_url: Optional[str] = None  # Optional for text posts
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    text_content: Optional[str] = Field(None, max_length=500)  # For text posts
    aspect_ratio: Optional[str] = None


class PortfolioItemUpdate(BaseModel):
    """Update portfolio item."""
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class PortfolioItemResponse(BaseModel):
    """Portfolio item response."""
    id: int
    user_id: int
    content_type: str
    content_url: Optional[str]
    thumbnail_url: Optional[str]
    title: Optional[str]
    description: Optional[str]
    text_content: Optional[str]
    aspect_ratio: Optional[str]
    views: int
    clicks: int
    order: int
    created_at: str


class ProjectCreate(BaseModel):
    """Create project."""
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = None
    tags: Optional[str] = None
    tools: Optional[str] = None
    project_url: Optional[str] = None


class ProjectUpdate(BaseModel):
    """Update project."""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    cover_image: Optional[str] = None
    tags: Optional[str] = None
    tools: Optional[str] = None
    project_url: Optional[str] = None
    order: Optional[int] = None


class ProjectResponse(BaseModel):
    """Project response."""
    id: int
    user_id: int
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    tags: Optional[str]
    tools: Optional[str]
    project_url: Optional[str]
    views: int
    clicks: int
    order: int
    media_count: int = 0
    created_at: str


class ProjectMediaCreate(BaseModel):
    """Add media to project."""
    media_url: str
    media_type: str = Field(..., description="photo or video")
    thumbnail_url: Optional[str] = None


class ProjectMediaResponse(BaseModel):
    """Project media response."""
    id: int
    project_id: int
    media_url: str
    media_type: str
    thumbnail_url: Optional[str]
    order: int
    created_at: str

