"""SQLModel database models for WebStar V1."""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    """User model."""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    username: str = Field(unique=True, index=True, nullable=False)
    hashed_password: Optional[str] = None  # Optional for OAuth users
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    
    # OAuth
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    oauth_provider: Optional[str] = None  # 'google', etc.
    
    # 2FA
    is_2fa_enabled: bool = Field(default=False)
    totp_secret: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class OnboardingProgress(SQLModel, table=True):
    """Track user onboarding progress."""
    __tablename__ = "onboarding_progress"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, nullable=False)
    
    # Onboarding steps
    archetype: Optional[str] = None  # Engineer, Artist, Sound-Maker, Communicator
    role: Optional[str] = None  # User's professional role
    expertise_level: Optional[str] = None  # Expertise level (semantic labels)
    
    # Completion tracking
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Profile(SQLModel, table=True):
    """User profile with extended information."""
    __tablename__ = "profiles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, nullable=False)
    
    # Profile fields
    display_name: Optional[str] = None
    role: Optional[str] = None  # From onboarding
    expertise_badge: Optional[str] = None  # From onboarding
    bio: Optional[str] = Field(default=None, max_length=200)  # Short bio below profile picture
    about: Optional[str] = Field(default=None, max_length=500)  # Detailed about section
    profile_picture: Optional[str] = None
    banner_image: Optional[str] = None  # Profile banner/cover image
    location: Optional[str] = None  # User location (e.g., "Paris, France")
    
    # Skills (comma-separated, max 6)
    skills: Optional[str] = None
    
    # Experience (JSON string)
    experience: Optional[str] = None  # Store as JSON string
    
    # External links
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    instagram_url: Optional[str] = None
    behance_url: Optional[str] = None
    soundcloud_url: Optional[str] = None
    
    # Social links (JSON string for additional links)
    social_links: Optional[str] = None  # Store as JSON: {email, tiktok, youtube, twitter}
    
    # Metrics
    profile_likes_count: int = Field(default=0)
    profile_views_count: int = Field(default=0)
    portfolio_items_count: int = Field(default=0)
    projects_count: int = Field(default=0)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PortfolioItem(SQLModel, table=True):
    """Portfolio item (photo, video, audio, text, or link)."""
    __tablename__ = "portfolio_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    
    # Content
    content_type: str = Field(nullable=False)  # 'photo', 'video', 'audio', 'text', 'link'
    content_url: Optional[str] = None  # Optional for text posts
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    text_content: Optional[str] = Field(default=None, max_length=500)  # For text posts
    
    # Format info
    aspect_ratio: Optional[str] = None  # '1:1', '4:5', '9:16', '16:9'
    file_size: Optional[int] = None
    duration: Optional[int] = None  # For audio/video in seconds
    
    # Analytics
    views: int = Field(default=0)
    clicks: int = Field(default=0)
    
    order: int = Field(default=0)  # Display order
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Project(SQLModel, table=True):
    """User project."""
    __tablename__ = "projects"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    
    title: str = Field(nullable=False)
    description: Optional[str] = Field(default=None, max_length=500)
    cover_image: Optional[str] = None
    
    # Project metadata
    tags: Optional[str] = None  # Comma-separated
    tools: Optional[str] = None  # Comma-separated tools used
    project_url: Optional[str] = None  # External project link
    
    # Analytics
    views: int = Field(default=0)
    clicks: int = Field(default=0)
    
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectMedia(SQLModel, table=True):
    """Media items within a project."""
    __tablename__ = "project_media"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", nullable=False)
    
    media_url: str = Field(nullable=False)
    media_type: str = Field(nullable=False)  # 'photo', 'video'
    thumbnail_url: Optional[str] = None
    
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProfileLike(SQLModel, table=True):
    """Profile likes (next-gen alternative to Follow)."""
    __tablename__ = "profile_likes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    liker_id: int = Field(foreign_key="users.id", nullable=False)
    liked_profile_user_id: int = Field(foreign_key="users.id", nullable=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProfileView(SQLModel, table=True):
    """Track profile views for analytics."""
    __tablename__ = "profile_views"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    profile_user_id: int = Field(foreign_key="users.id", nullable=False)
    viewer_id: Optional[int] = Field(foreign_key="users.id", nullable=True)  # None for anonymous
    viewer_ip: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PointsTransaction(SQLModel, table=True):
    """Track points earned for gamification."""
    __tablename__ = "points_transactions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    
    points: int = Field(nullable=False)  # Positive for earning, negative for spending
    action: str = Field(nullable=False)  # 'profile_photo', 'about', 'first_project', etc.
    description: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserPoints(SQLModel, table=True):
    """User's total points balance."""
    __tablename__ = "user_points"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, nullable=False)
    
    total_points: int = Field(default=0)
    available_points: int = Field(default=0)  # After spending on rewards
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)

