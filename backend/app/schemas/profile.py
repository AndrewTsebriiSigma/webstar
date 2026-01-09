"""Profile schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class ProfileUpdate(BaseModel):
    """Profile update schema."""
    display_name: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=200)  # Short bio below profile picture
    about: Optional[str] = Field(None, max_length=500)  # Detailed about section
    profile_picture: Optional[str] = None  # Profile picture URL
    banner_image: Optional[str] = None  # Banner/header image URL
    location: Optional[str] = None  # User location
    role: Optional[str] = None  # User role/title
    skills: Optional[str] = None  # Comma-separated, max 6
    experience: Optional[str] = None  # JSON string
    social_links: Optional[str] = None  # JSON string
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    instagram_url: Optional[str] = None
    behance_url: Optional[str] = None
    soundcloud_url: Optional[str] = None


class ProfileResponse(BaseModel):
    """Profile response schema."""
    id: int
    user_id: int
    username: str
    display_name: Optional[str]
    role: Optional[str]
    expertise_badge: Optional[str]
    bio: Optional[str]  # Short bio below profile picture
    about: Optional[str]  # Detailed about section
    profile_picture: Optional[str]
    banner_image: Optional[str]  # Banner/header image URL
    location: Optional[str]  # User location
    skills: Optional[str]
    experience: Optional[str]
    social_links: Optional[str]
    website: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    instagram_url: Optional[str]
    behance_url: Optional[str]
    soundcloud_url: Optional[str]
    
    # Metrics
    profile_likes_count: int
    profile_views_count: int
    portfolio_items_count: int
    projects_count: int
    
    # Gamification
    total_points: int = 0
    
    # Profile completeness helpers
    has_profile_picture: bool
    has_about: bool
    has_skills: bool
    profile_completeness: int  # Percentage


class ProfileMetrics(BaseModel):
    """Profile metrics/analytics."""
    profile_views_7d: int
    profile_views_30d: int
    profile_likes: int
    portfolio_views: int
    portfolio_clicks: int
    project_views: int
    project_clicks: int

