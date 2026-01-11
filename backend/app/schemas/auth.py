"""Authentication schemas."""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


class UserRegister(BaseModel):
    """User registration schema."""
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', v):
            raise ValueError('Username must be 3-20 characters and contain only letters, numbers, and underscores')
        return v


class UserLogin(BaseModel):
    """User login schema."""
    email: str  # Accepts both email and username
    password: str


class GoogleAuth(BaseModel):
    """Google OAuth schema."""
    token: str


class RefreshToken(BaseModel):
    """Refresh token schema."""
    refresh_token: str


class ProfileSetup(BaseModel):
    """Profile setup for OAuth users (username and name)."""
    username: str
    full_name: str


class UserPublicResponse(BaseModel):
    """Public user response - NO EMAIL for security."""
    id: int
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: str
    onboarding_completed: bool
    profile_setup_completed: bool = True
    role: str = "user"  # user, moderator, admin, super_admin
    is_banned: bool = False


class UserResponse(UserPublicResponse):
    """Private user response - includes email (only for user's own data)."""
    email: str


class LoginResponse(BaseModel):
    """Login response that may require 2FA."""
    requires_2fa: bool = False
    temp_token: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[UserResponse] = None
    message: Optional[str] = None


class Verify2FALoginRequest(BaseModel):
    """Verify 2FA code during login."""
    temp_token: str
    totp_code: str


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    user: Optional[UserResponse] = None


class OAuthCallbackData(BaseModel):
    """Secure OAuth callback data - NO sensitive info in URL."""
    state_token: str
    needs_profile_setup: bool = False
    needs_onboarding: bool = False
    requires_2fa: bool = False
