"""App Settings router for account, privacy, notifications, and 2FA."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.db.base import get_session
from app.db.models import User, EmailChangeRequest
from app.deps.auth import get_current_user
from app.services.totp_service import TOTPService
from app.services.email_service import send_verification_email, generate_verification_code
from app.core.security import verify_password, get_password_hash

router = APIRouter()


# ============= Schemas =============

class RequestEmailChangeSchema(BaseModel):
    new_email: EmailStr
    password: str


class VerifyEmailChangeSchema(BaseModel):
    code: str


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

@router.post("/account/request-email-change")
async def request_email_change(
    request: RequestEmailChangeSchema,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Request email change - sends verification code to new email."""
    # Check if user has a password (not OAuth-only)
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change email for accounts created with Google Sign-In. Your email is managed by Google."
        )
    
    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check if new email already exists
    existing = session.exec(select(User).where(User.email == request.new_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use"
        )
    
    # Delete any existing change requests for this user
    existing_requests = session.exec(
        select(EmailChangeRequest).where(EmailChangeRequest.user_id == current_user.id)
    ).all()
    for req in existing_requests:
        session.delete(req)
    session.commit()
    
    # Generate verification code and create request
    code = generate_verification_code()
    change_request = EmailChangeRequest(
        user_id=current_user.id,
        new_email=request.new_email,
        verification_code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    session.add(change_request)
    session.commit()
    
    # Send verification email to NEW email
    send_verification_email(request.new_email, code)
    
    return {"message": "Verification code sent to your new email address"}


@router.post("/account/verify-email-change")
async def verify_email_change(
    request: VerifyEmailChangeSchema,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify code and complete email change. All user data stays linked via user_id."""
    # Find pending change request
    change_request = session.exec(
        select(EmailChangeRequest).where(
            (EmailChangeRequest.user_id == current_user.id) &
            (EmailChangeRequest.verified == False)
        )
    ).first()
    
    if not change_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending email change request found"
        )
    
    # Check expiry
    if datetime.utcnow() > change_request.expires_at:
        session.delete(change_request)
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
    
    # Verify code
    if change_request.verification_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )
    
    # Update user email - all data stays linked via user_id!
    old_email = current_user.email
    current_user.email = change_request.new_email
    session.add(current_user)
    
    # Delete the change request
    session.delete(change_request)
    session.commit()
    
    return {
        "message": "Email updated successfully", 
        "new_email": current_user.email,
        "old_email": old_email
    }


@router.post("/account/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Change user password."""
    # Check if user has a password (not OAuth-only)
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for accounts created with Google Sign-In. Please use Google to access your account."
        )
    
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

