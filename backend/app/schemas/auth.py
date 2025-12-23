"""Authentication schemas."""
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """User registration schema."""
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8)
    full_name: str


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class GoogleAuth(BaseModel):
    """Google OAuth token."""
    token: str  # Google ID token


class Token(BaseModel):
    """Token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshToken(BaseModel):
    """Refresh token request."""
    refresh_token: str


class UserResponse(BaseModel):
    """User response schema."""
    id: int
    email: str
    username: str
    full_name: str | None
    is_active: bool
    created_at: str
    
    # Onboarding status
    onboarding_completed: bool = False

