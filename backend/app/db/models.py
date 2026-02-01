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
    
    # Profile setup (for OAuth users who need to set username/name)
    profile_setup_completed: bool = Field(default=True)  # True for manual signup, False for new OAuth users
    
    # 2FA
    is_2fa_enabled: bool = Field(default=False)
    totp_secret: Optional[str] = None
    
    # Admin/Role system - Roles: user, moderator, admin, super_admin
    role: str = Field(default="user", index=True)
    is_banned: bool = Field(default=False)
    banned_at: Optional[datetime] = None
    banned_by: Optional[int] = None  # Admin user ID who banned
    ban_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class EmailVerification(SQLModel, table=True):
    """Email verification codes for signup."""
    __tablename__ = "email_verifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False)
    code: str = Field(nullable=False)  # 6-digit code
    expires_at: datetime = Field(nullable=False)
    verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


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
    
    # Portfolio customization settings (JSON string)
    portfolio_customization: Optional[str] = None  # Store as JSON: {gridColumns, gridGap, gridRadius, layoutMode, gridAspectRatio}
    
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
    attachment_url: Optional[str] = None  # For audio/PDF attachments
    attachment_type: Optional[str] = None  # 'audio' or 'pdf'
    
    # Format info
    aspect_ratio: Optional[str] = None  # '1:1', '4:5', '9:16', '16:9'
    file_size: Optional[int] = None
    duration: Optional[int] = None  # For audio/video in seconds
    
    # Draft status
    is_draft: bool = Field(default=False)
    
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
    
    # Draft status
    is_draft: bool = Field(default=False)
    
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


class OAuthState(SQLModel, table=True):
    """OAuth state tokens for CSRF protection."""
    __tablename__ = "oauth_states"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    state_token: str = Field(unique=True, index=True, nullable=False)
    expires_at: datetime = Field(nullable=False)
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PasswordResetToken(SQLModel, table=True):
    """Password reset tokens for forgot password flow."""
    __tablename__ = "password_reset_tokens"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    token: str = Field(unique=True, index=True, nullable=False)
    expires_at: datetime = Field(nullable=False)
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BlockedUser(SQLModel, table=True):
    """Blocked users relationship."""
    __tablename__ = "blocked_users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    blocker_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    blocked_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmailChangeRequest(SQLModel, table=True):
    """Email change verification requests for secure email updates."""
    __tablename__ = "email_change_requests"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    new_email: str = Field(nullable=False, index=True)
    verification_code: str = Field(nullable=False)
    expires_at: datetime = Field(nullable=False)
    verified: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Report(SQLModel, table=True):
    """User reports for profiles/content moderation."""
    __tablename__ = "reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Reporter info
    reporter_id: Optional[int] = Field(default=None, foreign_key="users.id")  # None for anonymous
    reporter_ip: Optional[str] = None
    
    # Target info
    target_type: str = Field(nullable=False, index=True)  # 'profile', 'portfolio', 'project'
    target_id: int = Field(nullable=False)  # ID of the reported item
    target_user_id: int = Field(foreign_key="users.id", nullable=False)  # Owner of reported item
    
    # Report details
    reason: str = Field(nullable=False)  # 'spam', 'harassment', 'inappropriate', 'fake', 'copyright', 'other'
    description: Optional[str] = Field(default=None, max_length=500)
    
    # Status: pending, reviewing, resolved, dismissed
    status: str = Field(default="pending", index=True)
    resolved_by: Optional[int] = Field(default=None, foreign_key="users.id")
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AdminAction(SQLModel, table=True):
    """Audit log for admin actions."""
    __tablename__ = "admin_actions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    admin_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    
    # Action details
    action_type: str = Field(nullable=False, index=True)  # 'ban', 'unban', 'delete', 'edit', 'role_change', 'resolve_report'
    target_type: str = Field(nullable=False)  # 'user', 'profile', 'portfolio', 'project', 'report'
    target_id: int = Field(nullable=False)
    
    # Additional details as JSON string
    details: Optional[str] = None
    ip_address: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Quiz(SQLModel, table=True):
    """Quiz definition."""
    __tablename__ = "quizzes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(nullable=False)
    description: Optional[str] = None
    slug: str = Field(unique=True, index=True, nullable=False)  # 'discover-hidden-skills'
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class QuizQuestion(SQLModel, table=True):
    """Quiz question."""
    __tablename__ = "quiz_questions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    quiz_id: int = Field(foreign_key="quizzes.id", nullable=False, index=True)
    question_text: str = Field(nullable=False)
    question_order: int = Field(nullable=False)  # Order within quiz
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuizAnswer(SQLModel, table=True):
    """Quiz answer option."""
    __tablename__ = "quiz_answers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="quiz_questions.id", nullable=False, index=True)
    answer_text: str = Field(nullable=False)
    answer_order: int = Field(nullable=False)  # Order within question
    score_value: int = Field(default=0)  # Score contribution for this answer
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuizResult(SQLModel, table=True):
    """User's quiz result."""
    __tablename__ = "quiz_results"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(foreign_key="users.id", nullable=True, index=True)  # Nullable for anonymous users
    quiz_id: int = Field(foreign_key="quizzes.id", nullable=False, index=True)
    
    # Store answers as JSON: [{"question_id": 1, "answer_id": 3}, ...]
    answers_json: str = Field(nullable=False)
    total_score: int = Field(nullable=False)
    result_summary: Optional[str] = None  # Generated result text
    
    # Anonymous user tracking
    session_id: Optional[str] = None  # For anonymous users before signup
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

