"""Authentication router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.db.base import get_session
from app.db.models import User, Profile, OnboardingProgress, UserPoints
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.schemas.auth import UserRegister, UserLogin, Token, RefreshToken, GoogleAuth, UserResponse

router = APIRouter()


@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, session: Session = Depends(get_session)):
    """Register a new user with email and password."""
    # Check if email exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_username = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Create profile
    profile = Profile(user_id=user.id, display_name=user_data.full_name)
    session.add(profile)
    
    # Create onboarding progress
    onboarding = OnboardingProgress(user_id=user.id)
    session.add(onboarding)
    
    # Create points account
    points = UserPoints(user_id=user.id)
    session.add(points)
    
    session.commit()
    
    # Create tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=False
        )
    )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login with email and password."""
    # Find user
    user = session.exec(select(User).where(User.email == user_data.email)).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Check onboarding status
    onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
    onboarding_completed = onboarding.completed if onboarding else False
    
    # Create tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=onboarding_completed
        )
    )


@router.post("/google", response_model=Token)
async def google_auth(auth_data: GoogleAuth, session: Session = Depends(get_session)):
    """Authenticate with Google OAuth."""
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            auth_data.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Check if user exists
        user = session.exec(select(User).where(User.google_id == google_id)).first()
        
        if not user:
            # Check if email exists (linking account)
            user = session.exec(select(User).where(User.email == email)).first()
            if user:
                # Link Google account
                user.google_id = google_id
                user.oauth_provider = 'google'
                session.add(user)
                session.commit()
            else:
                # Create new user
                # Generate username from email
                username = email.split('@')[0]
                # Ensure username is unique
                counter = 1
                original_username = username
                while session.exec(select(User).where(User.username == username)).first():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user = User(
                    email=email,
                    username=username,
                    full_name=name,
                    google_id=google_id,
                    oauth_provider='google'
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                
                # Create profile
                profile = Profile(user_id=user.id, display_name=name)
                session.add(profile)
                
                # Create onboarding progress
                onboarding = OnboardingProgress(user_id=user.id)
                session.add(onboarding)
                
                # Create points account
                points = UserPoints(user_id=user.id)
                session.add(points)
                
                session.commit()
        
        # Check onboarding status
        onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
        onboarding_completed = onboarding.completed if onboarding else False
        
        # Create tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                full_name=user.full_name,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
                onboarding_completed=onboarding_completed
            )
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )


@router.post("/refresh", response_model=Token)
async def refresh(token_data: RefreshToken, session: Session = Depends(get_session)):
    """Refresh access token."""
    payload = decode_token(token_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user
    user = session.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Check onboarding status
    onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
    onboarding_completed = onboarding.completed if onboarding else False
    
    # Create new tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=onboarding_completed
        )
    )

