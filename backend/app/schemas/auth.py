"""Authentication schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    """User registration schema."""
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class GoogleAuth(BaseModel):
    """Google OAuth schema."""
    token: str


class RefreshToken(BaseModel):
    """Refresh token schema."""
    refresh_token: str


class UserResponse(BaseModel):
    """User response schema."""
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: str
    onboarding_completed: bool


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
