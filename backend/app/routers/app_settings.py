"""App Settings router for account, privacy, notifications, and 2FA."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.db.base import get_session
from app.db.models import User
from app.deps.auth import get_current_user
from app.services.totp_service import TOTPService
from app.core.security import verify_password, get_password_hash

router = APIRouter()


# ============= Schemas =============

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class Enable2FAResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code
    backup_codes: List[str] = []


class Verify2FARequest(BaseModel):
    token: str


# ============= Account Routes =============

@router.post("/account/change-email")
async def change_email(
    request: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Change user email."""
    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check if email already exists
    existing = session.exec(select(User).where(User.email == request.new_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )
    
    # Update email
    current_user.email = request.new_email
    session.add(current_user)
    session.commit()
    
    return {"message": "Email updated successfully"}


@router.post("/account/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Change user password."""
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid current password"
        )
    
    # Validate new password
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(request.new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password updated successfully"}


# ============= 2FA Routes =============

@router.post("/account/2fa/enable", response_model=Enable2FAResponse)
async def enable_2fa(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Enable 2FA for user account."""
    if current_user.is_2fa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    # Generate TOTP secret
    secret = TOTPService.generate_secret()
    
    # Store secret temporarily (not yet enabled)
    current_user.totp_secret = secret
    session.add(current_user)
    session.commit()
    
    # Generate QR code
    qr_code = TOTPService.generate_qr_code(secret, current_user.email)
    
    return Enable2FAResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=[]  # TODO: Implement backup codes
    )


@router.post("/account/2fa/verify")
async def verify_2fa_setup(
    request: Verify2FARequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify 2FA token and complete setup."""
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Call /enable first."
        )
    
    # Verify the token
    if not TOTPService.verify_token(current_user.totp_secret, request.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )
    
    # Enable 2FA
    current_user.is_2fa_enabled = True
    session.add(current_user)
    session.commit()
    
    return {"message": "2FA enabled successfully"}


@router.post("/account/2fa/disable")
async def disable_2fa(
    request: Verify2FARequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Disable 2FA."""
    if not current_user.is_2fa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    # Verify token before disabling
    if not TOTPService.verify_token(current_user.totp_secret, request.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )
    
    # Disable 2FA
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    session.add(current_user)
    session.commit()
    
    return {"message": "2FA disabled successfully"}


@router.get("/account/2fa/status")
async def get_2fa_status(current_user: User = Depends(get_current_user)):
    """Get 2FA status."""
    return {
        "is_enabled": current_user.is_2fa_enabled
    }

